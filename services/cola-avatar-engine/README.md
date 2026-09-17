# Standalone avatar engine

**Next milestone: real offline CUDA render. Not yet demonstrated.** This directory is the entire service build context. Copy it to any accessible NVIDIA host; no application repository, browser, backend account or ShibaOS installation is required. ShibaOS is a future container host only.

Development order is mandatory:

1. Approved source motion + real character voice WAV → offline CUDA MP4; inspect it.
2. After that succeeds, finish the local service test page at `http://localhost:8000/test` with WAV upload, Interrupt and measured telemetry.
3. Deploy the same image to an accessible CUDA host and test from another computer.
4. Only after remote acceptance, connect the website.

The existing signaling implementation is experimental draft code. `/test` is **not implemented yet**. Do not infer GPU acceptance from CPU tests, a health response, or the presence of WebRTC code. Website integration work is paused.

## First test: offline render

Target environment: Linux x86-64 with an NVIDIA GPU, compatible driver and NVIDIA Container Toolkit. The Dockerfile pins PyTorch 2.2.2 / CUDA 12.1. An RTX 4080 with 16 GB is an intended development target, not a measured requirement or performance claim. No GPU rental is provisioned automatically.

From this directory:

```sh
docker compose build avatar
mkdir -p models results
# This installation step needs network access. Rendering below does not.
docker compose run --rm --user "$(id -u):$(id -g)" \
  -e HF_HOME=/tmp/huggingface -e HF_HUB_OFFLINE=0 -e TRANSFORMERS_OFFLINE=0 \
  -v "$PWD/models:/app/models:rw" avatar python tools/download_models.py
```

Supply the approved source clip (1280×720, 25 fps, 1–4 seconds) and real voice WAV. Choose a face crop by inspecting that clip; no crop is fabricated. A website portrait cannot establish natural source motion. Preprocess the source on CUDA:

```sh
docker compose run --rm --user "$(id -u):$(id -g)" \
  -v "$PWD/avatar_packages:/app/avatar_packages:rw" \
  -v /absolute/approved-media:/media:ro \
  avatar python tools/build_avatar.py --avatar cola_b \
  --source /media/cola.mp4 --crop X1,Y1,X2,Y2
```

The cache contains frames, fixed face boxes, geometric anchors (not detected landmarks), a lower-face mask, VAE latents, source SHA-256, motion and colour metadata. The crop must stay aligned throughout the clip. Substantial head motion requires better tracking after this milestone; inspect seams, mouth shape, blinks, identity and the ping-pong loop manually.

Render the actual WAV with model downloads disabled:

```sh
docker compose run --rm --user "$(id -u):$(id -g)" \
  -v /absolute/approved-media:/media:ro -v "$PWD/results:/results:rw" \
  --entrypoint python avatar tools/test_render.py \
  --avatar cola_b --audio /media/test.wav --output /results/cola_test.mp4
```

The command forces Hugging Face and Transformers offline mode. To prove full network isolation, run the built image directly (replace the tag with your build's image name):

```sh
docker build -t cola-avatar-engine:offline .
docker run --rm --gpus all --network none --user "$(id -u):$(id -g)" \
  -v "$PWD/models:/app/models:ro" -v "$PWD/avatar_packages:/app/avatar_packages:ro" \
  -v /absolute/approved-media:/media:ro -v "$PWD/results:/results:rw" \
  cola-avatar-engine:offline python tools/test_render.py \
  --avatar cola_b --audio /media/test.wav --output /results/cola_test.mp4
```

The input must be uncompressed PCM16, mono, 16 kHz, greater than zero and at most 45 seconds. Retain the real source WAV. If conversion is necessary, explicitly create a separate file with `ffmpeg -i original.wav -ac 1 -ar 16000 -c:a pcm_s16le test.wav`. The CLI never silently changes the input samples. The MP4 uses H.264 and AAC; AAC is lossy and carries the input voice, not regenerated speech.

Outputs:

- `cola_test.mp4`: real generated video, only published after complete render and successful encoding.
- `cola_test.metrics.json`: GPU, PyTorch CUDA version, model load/warmup time, first frame latency, render FPS excluding encoding, end-to-end FPS/latency, PyTorch peak allocated/reserved VRAM and source/audio hashes. Allocator peaks are not total device usage. Failed runs produce a failure report and no MP4.

Inspect and listen to the MP4, recording lip/audio alignment, identity, mouth/teeth artifacts, crop seams, blink continuity and source-loop discontinuities. The CLI leaves visual review and milestone acceptance pending even when rendering succeeds. Do not label a CPU fixture or an unrelated character/audio clip as Cola acceptance.

## Local Python alternative

Use Python 3.10/3.11 on the NVIDIA host in an isolated environment. Install PyTorch 2.2.2 / torchvision 0.17.2 CUDA 12.1 wheels, then `pip install -r requirements.txt`. Install FFmpeg, clone MuseTalk at the revision in `models.lock.json`, and set `PYTHONPATH` to that checkout. Install weights once, preprocess the clip, then run:

```sh
python tools/test_render.py --avatar cola_b --audio test.wav --output cola_test.mp4
```

No server, ticket, application secret or external API is used by this command.

## Service startup (subsequent milestone)

`python server.py` or `docker compose up` starts the service on port 8000. Compose's optional `.env` file requires Docker Compose 2.24 or newer. Missing models/cache/CUDA yields unhealthy `/health`; it never claims a loaded renderer. Exactly one installed package is auto-selected, or set `AVATAR_ID` to choose one. Package identity is data under `avatar_packages/`.

For authenticated sessions, copy `.env.example` to `.env` and configure a random 32+ byte ticket key, issuer, audience and allowed origins. The service validates the generic ticket contract in `ARCHITECTURE.md`; it never queries the issuer's backend. Offline rendering needs none of these settings. Do not expose the service until offline and local-page acceptance succeed. Later deployments need HTTPS/WSS and routable media or TURN.

## CPU verification

```sh
pip install -r requirements-test.txt
python -m pytest tests -q
python tools/check_licenses.py
```

These checks cover WAV fidelity/rejection, honest failure reports, generic package lookup, tickets, cancellation and media transport. They do **not** establish model loading, GPU throughput, appearance, lip sync, real voice provenance or Docker deployment. Current streaming draft buffers a whole short utterance; sub-1.5-second response latency is unmeasured.
