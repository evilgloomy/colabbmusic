# Shiba native avatar worker (Cola package)

**Implementation available; GPU acceptance pending.** This service runs on a Shiba-controlled NVIDIA host, independently of the web host. It uses MuseTalk 1.5 for face rendering and returns original MiniMax PCM plus video in one WebRTC stream. An unavailable renderer returns 503 so the browser uses the editorial portrait and local MiniMax voice.

## NVIDIA setup

Target: Linux x86-64, NVIDIA RTX 4080, current compatible NVIDIA driver, Docker with NVIDIA Container Toolkit. CUDA 12.1 / PyTorch 2.2.2 image is pinned in Dockerfile. At least 16 GB VRAM is the intended development target; capacity/performance is not yet measured.

1. Copy `.env.example` to `.env`, set a random 32+ byte `AVATAR_JWT_SECRET` matching Supabase, allowed web origins and ICE settings. Never commit `.env`.
2. `docker compose build avatar`.
3. Download audited weights into a writable host mount, as your host UID:

   ```sh
   mkdir -p models
   docker compose run --rm --user "$(id -u):$(id -g)" -e HF_HOME=/tmp/huggingface -v "$PWD/models:/app/models:rw" avatar python tools/download_models.py
   ```

4. Supply a Shiba-approved 1280×720, 25fps neutral motion clip, 1–4 seconds, with natural breathing, blinks and restrained head motion. The fallback website portrait is retained but does not create a natural motion source. Do not use upstream demo/test footage.
5. Preprocess once on the GPU. Choose a face crop after inspecting your actual clip; there is deliberately no invented Cola crop:

   ```sh
   docker compose run --rm --user "$(id -u):$(id -g)" -v "$PWD/avatar_packages:/app/avatar_packages:rw" -v /absolute/approved-media:/media:ro avatar python tools/build_avatar.py --character cola_b --source /media/cola.mp4 --crop X1,Y1,X2,Y2
   ```

   Review every cached crop, mouth blend, color seam, and ping-pong loop. The current builder uses a fixed operator-reviewed crop and a geometric lower-face mask. Large head movement requires per-frame crop tracking or an independently audited face parser; it is not production approved by default.
6. `docker compose up -d avatar`.
7. Put HTTPS/WSS reverse proxy in front of port 8080. Configure WebSocket upgrade, body size limits, connection rate limits and timeouts. Signaling is bound to loopback in the example compose file. Media requires TURN or routable UDP; Docker bridge mode alone will not work for arbitrary internet clients. Worker-side TURN credentials stay on the GPU host; browser credentials are short-lived coturn REST credentials minted by the edge function using `AVATAR_TURN_SECRET`.
8. Check `/health`: `ok`, `model_loaded` and `avatar_loaded` must all be true. Missing cache, weights or CUDA keeps them false. `fps: null` means not measured.

## Local Python alternative

Use Python 3.10/3.11 on the NVIDIA host and an isolated venv. Install torch 2.2.2/torchvision 0.17.2 from the official CUDA 12.1 wheel index, then `pip install -r requirements.txt`. Clone MuseTalk at the exact revision in `models.lock.json` and set `PYTHONPATH` to it. Run `python tools/download_models.py`, then the builder above, then `python server.py`. FFmpeg must be installed. No Lovable compute or AI agent is involved.

## CPU tests

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r requirements-test.txt
python -m pytest tests -q
python tools/check_licenses.py
```

The WebRTC test opens local UDP sockets and sends synthetic images/audio. It tests transport and timestamp handling, **not CUDA inference, Cola appearance, real lip sync or provider credentials**.

## Performance / operational limits

One active session per worker by default. Tokens expire after 15 minutes and teardown connections; reconnect for another interview. Audio is capped at 45 seconds per utterance. Control messages and queues are bounded. Barge-in clears queued media and invalidates the inference generation immediately; an already-running CUDA kernel finishes in its thread and its stale output is discarded. The global inference lock remains held until that work exits.

This first implementation buffers a short utterance before Whisper feature extraction and streams generated frames in batches. Therefore the <1.5s voice target for the native path is **not yet achieved or measured**. Future rolling-window audio conditioning is required if measured latency is too high. Local MiniMax fallback streams PCM as it arrives. Source motion is replayed gently at state-dependent speeds; dedicated listening nods/thinking gaze clips remain artistic work.

Do not promote to production until the Cantonese acceptance conversation, mid-sentence barge-in, 10-minute soak, real TURN connectivity, audio single-authority, FPS and AV offset have been checked on the deployed worker.
