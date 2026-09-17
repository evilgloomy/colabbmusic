import asyncio
import json
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from security import validate_token
from media import Timeline, AVFrame, tracks

sessions = {}
used_tokens = {}
renderer = None
render_lock = asyncio.Lock()
origins = os.environ.get("AVATAR_ALLOWED_ORIGINS", "https://colabbmusic.com").split(",")


@asynccontextmanager
async def lifespan(app):
    global renderer
    try:
        from renderer import MuseTalkRenderer
        renderer = await asyncio.to_thread(MuseTalkRenderer, Path(os.getenv("MODEL_DIR", "models")), Path("avatar_packages/cola_b"))
    except Exception:
        # Offline worker is explicitly unhealthy; never claim a renderer loaded.
        renderer = None
    yield
    await asyncio.gather(*(session.close() for session in list(sessions.values())), return_exceptions=True)


app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["POST", "GET"], allow_headers=["Authorization", "Content-Type"])


@app.get("/health")
async def health():
    return {"ok": renderer is not None, "renderer": "musetalk-1.5", "cuda": renderer is not None,
            "gpu": renderer.gpu if renderer else None, "model_loaded": renderer is not None,
            "avatar_loaded": renderer is not None, "fps": renderer.inference_fps if renderer else None}


class Offer(BaseModel):
    session_id: str = Field(max_length=36)
    type: str = Field(pattern="^offer$")
    sdp: str = Field(max_length=64000)


class Session:
    def __init__(self, claims, pc):
        self.claims, self.pc = claims, pc
        self.ws = None
        self.timeline = Timeline(renderer.idle, self.event)
        self.audio = bytearray()
        self.utterance = None
        self.ended = False
        self.render_task = None
        self.expiry_task = None
        self.closed = False

    async def event(self, data):
        if self.ws and not self.closed:
            try: await self.ws.send_json(data)
            except (RuntimeError, WebSocketDisconnect): pass

    def cancel(self):
        self.timeline.cancel()
        self.audio.clear()
        self.utterance = None
        self.ended = False
        # Do not cancel the to_thread future: CUDA must finish before releasing
        # the global lock. Its generation predicate prevents stale frame output.

    async def render(self, pcm, uid, generation):
        def stale():
            return self.closed or generation != self.timeline.generation
        try:
            async with render_lock:
                if stale(): return
                iterator = renderer.render(pcm, stale, self.timeline.energy)
                sentinel = object()
                while not stale():
                    frame = await asyncio.to_thread(next, iterator, sentinel)
                    if frame is sentinel: break
                    if stale(): break
                    image, audio, final = frame
                    await self.timeline.pending.put(AVFrame(image, audio, uid, generation, final))
                await self.event({"type": "telemetry", "metrics": {
                    "gpu": renderer.gpu, "inference_fps": renderer.inference_fps,
                    "frame_inference_ms": renderer.frame_ms, "render_queue": self.timeline.pending.qsize(),
                    "av_offset_ms": None}})
        except Exception:
            await self.event({"type": "runtime.error", "id": uid})

    async def expire(self):
        await asyncio.sleep(max(0, self.claims["exp"] - time.time()))
        await self.close()

    async def close(self):
        if self.closed: return
        self.closed = True
        self.cancel()
        if self.expiry_task and self.expiry_task is not asyncio.current_task(): self.expiry_task.cancel()
        await self.timeline.close()
        await self.pc.close()
        if self.ws:
            try: await self.ws.close()
            except RuntimeError: pass
        sessions.pop(self.claims["session_id"], None)


@app.post("/offer")
async def offer(body: Offer, request: Request):
    from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer
    try:
        claims = validate_token(request.headers.get("Authorization", "").removeprefix("Bearer "))
    except Exception:
        raise HTTPException(401, "unauthorized")
    if body.session_id != claims["session_id"]: raise HTTPException(403, "session_scope")
    if renderer is None: raise HTTPException(503, "renderer_unavailable")
    now = time.time()
    for token, expires in list(used_tokens.items()):
        if expires < now: used_tokens.pop(token, None)
    if claims["jti"] in used_tokens: raise HTTPException(409, "ticket_already_used")
    if len(sessions) >= int(os.getenv("MAX_SESSIONS", "1")): raise HTTPException(503, "worker_busy")
    used_tokens[claims["jti"]] = claims["exp"]
    ice = []
    if os.getenv("AVATAR_STUN_URL"): ice.append(RTCIceServer(urls=os.environ["AVATAR_STUN_URL"]))
    if os.getenv("AVATAR_TURN_URL"):
        ice.append(RTCIceServer(urls=os.environ["AVATAR_TURN_URL"], username=os.getenv("AVATAR_TURN_USERNAME"), credential=os.getenv("AVATAR_TURN_PASSWORD")))
    pc = RTCPeerConnection(RTCConfiguration(iceServers=ice))
    session = Session(claims, pc)
    sessions[body.session_id] = session
    session.expiry_task = asyncio.create_task(session.expire())
    @pc.on("connectionstatechange")
    async def connection_changed():
        if pc.connectionState in ("failed", "closed", "disconnected"): await session.close()
    try:
        for track in tracks(session.timeline): pc.addTrack(track)
        await pc.setRemoteDescription(RTCSessionDescription(sdp=body.sdp, type=body.type))
        await asyncio.wait_for(pc.setLocalDescription(await pc.createAnswer()), timeout=12)
        # Close allocations that never complete authenticated control setup.
        async def setup_deadline():
            await asyncio.sleep(15)
            if not session.ws: await session.close()
        asyncio.create_task(setup_deadline())
        return {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
    except Exception:
        await session.close()
        raise HTTPException(503, "connection_failed")


@app.websocket("/control")
async def control(ws: WebSocket):
    if ws.headers.get("origin") not in origins:
        await ws.close(code=1008); return
    await ws.accept()
    session = None
    try:
        auth = await asyncio.wait_for(ws.receive_json(), timeout=5)
        claims = validate_token(auth.get("token", ""))
        if auth.get("type") != "authenticate" or claims["session_id"] != auth.get("session_id"): raise ValueError("scope")
        session = sessions.get(claims["session_id"])
        if not session or session.claims != claims or session.ws: raise ValueError("session")
        session.ws = ws
        await ws.send_json({"type": "avatar.ready"})
        while True:
            message = await ws.receive()
            if message["type"] == "websocket.disconnect": break
            if time.time() >= claims["exp"]: break
            data = message.get("bytes")
            if data is not None:
                if not session.utterance or session.ended or len(data) > 16000 or len(data) % 2: raise ValueError("audio_protocol")
                if len(session.audio) + len(data) > 16000 * 2 * 45: raise ValueError("audio_limit")
                session.audio.extend(data)
                continue
            text = message.get("text", "")
            if len(text) > 4096: raise ValueError("control_limit")
            command = json.loads(text)
            kind = command.get("type")
            if kind == "avatar.cancel": session.cancel()
            elif kind == "avatar.state":
                if command.get("state") not in ("IDLE", "LISTENING", "THINKING", "SPEAKING"): raise ValueError("state")
                session.timeline.state = command["state"]
            elif kind == "avatar.begin":
                if command.get("sample_rate") != 16000 or command.get("format") != "pcm_s16le": raise ValueError("format")
                uid = command.get("id")
                if not isinstance(uid, str) or not 1 <= len(uid) <= 64: raise ValueError("id")
                session.cancel()
                session.utterance = uid
                session.timeline.energy = max(0, min(1, float(command.get("emotion", {}).get("energy", .5))))
            elif kind == "avatar.end":
                if command.get("id") != session.utterance or session.ended or not session.audio: raise ValueError("utterance")
                session.ended = True
                session.render_task = asyncio.create_task(session.render(bytes(session.audio), session.utterance, session.timeline.generation))
                session.audio.clear()
            else: raise ValueError("unknown_control")
    except (WebSocketDisconnect, asyncio.TimeoutError, ValueError, KeyError):
        pass
    except Exception:
        pass
    finally:
        if session and session.ws is ws: await session.close()
        else:
            try: await ws.close(code=1008)
            except RuntimeError: pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080, ws_max_size=65536)
