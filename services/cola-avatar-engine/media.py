"""One 16 kHz / 25 fps timeline for original PCM and generated frames."""
import asyncio
import time
from dataclasses import dataclass
from fractions import Fraction

SAMPLE_RATE = 16000
FPS = 25
SAMPLES_PER_FRAME = SAMPLE_RATE // FPS
BYTES_PER_FRAME = SAMPLES_PER_FRAME * 2


def split_pcm(data: bytes):
    if len(data) % 2:
        raise ValueError("unaligned_pcm")
    for offset in range(0, len(data), BYTES_PER_FRAME):
        yield data[offset:offset + BYTES_PER_FRAME].ljust(BYTES_PER_FRAME, b"\0")


def motion_index(tick, length, state, energy=0.5):
    """Restrained motion comes from the approved clip, never synthetic mouth motion."""
    speed = {"IDLE": .8, "LISTENING": .9, "THINKING": .75, "SPEAKING": .9 + .2 * max(0, min(1, energy))}[state]
    index = int(tick * speed) % max(1, length * 2 - 2)
    return index if index < length else length * 2 - 2 - index


@dataclass
class AVFrame:
    image: object
    pcm: bytes
    utterance: str
    generation: int
    final: bool = False


class Timeline:
    def __init__(self, idle, event):
        self.idle = idle
        self.event = event
        self.pending = asyncio.Queue(maxsize=25)
        self.audio = asyncio.Queue(maxsize=4)
        self.video = asyncio.Queue(maxsize=2)
        self.generation = 0
        self.tick = 0
        self.state = "IDLE"
        self.energy = .5
        self.current = None
        self.task = None

    def start(self):
        if self.task is None:
            self.task = asyncio.create_task(self.run())

    def cancel(self):
        self.generation += 1
        self.current = None
        self.state = "LISTENING"
        for queue in (self.pending, self.audio, self.video):
            while not queue.empty():
                queue.get_nowait()

    async def run(self):
        origin = time.monotonic()
        while True:
            await asyncio.sleep(max(0, origin + self.tick / FPS - time.monotonic()))
            # A stalled sender cannot accumulate stale audio/video. Fail the session.
            if self.audio.full() or self.video.full():
                await self.event({"type": "runtime.error", "id": self.current})
                return
            frame = None
            if not self.pending.empty():
                candidate = self.pending.get_nowait()
                if candidate.generation == self.generation:
                    frame = candidate
            image = self.idle(self.tick, self.state, self.energy)
            pcm = bytes(BYTES_PER_FRAME)
            if frame:
                image, pcm = frame.image, frame.pcm
                if self.current != frame.utterance:
                    self.current = frame.utterance
                    self.state = "SPEAKING"
                    await self.event({"type": "avatar.speaking.started", "id": self.current})
            # Both tracks share tick zero and advance even during idle/underflow.
            await self.video.put((image, self.tick * 3600))
            await self.audio.put((pcm[:640], self.tick * 640))
            await self.audio.put((pcm[640:], self.tick * 640 + 320))
            self.tick += 1
            if frame and frame.final:
                await asyncio.sleep(1 / FPS)
                await self.event({"type": "avatar.speaking.completed", "id": frame.utterance})
                self.current = None
                self.state = "LISTENING"

    async def close(self):
        self.cancel()
        if self.task:
            self.task.cancel()
            await asyncio.gather(self.task, return_exceptions=True)


def tracks(timeline):
    import av
    import numpy as np
    from aiortc import MediaStreamTrack

    class AudioTrack(MediaStreamTrack):
        kind = "audio"
        async def recv(self):
            timeline.start()
            pcm, pts = await timeline.audio.get()
            frame = av.AudioFrame.from_ndarray(np.frombuffer(pcm, dtype="<i2").reshape(1, -1), format="s16", layout="mono")
            frame.sample_rate = SAMPLE_RATE
            frame.pts, frame.time_base = pts, Fraction(1, SAMPLE_RATE)
            return frame

    class VideoTrack(MediaStreamTrack):
        kind = "video"
        async def recv(self):
            timeline.start()
            image, pts = await timeline.video.get()
            frame = av.VideoFrame.from_ndarray(image, format="bgr24")
            frame.pts, frame.time_base = pts, Fraction(1, 90000)
            return frame

    return AudioTrack(), VideoTrack()
