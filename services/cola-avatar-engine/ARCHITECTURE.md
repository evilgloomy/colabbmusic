# Standalone engine boundary and draft protocol

The engine receives an avatar ID, PCM audio, LEMO state and control events. It returns generated video with the supplied audio, telemetry and status. Character identity and cached motion are data. It imports no application backend, browser code or ShibaOS source. Model download is a separate setup operation; inference uses local weights only.

## Current priority

`tools/build_avatar.py` prepares an approved source clip. `tools/test_render.py` invokes `MuseTalkRenderer` directly and encodes an MP4 without starting the server or opening a network connection. A real CUDA render and visual review are required before extending streaming or connecting any website.

`renderer.py` contains inference, `assets.py` resolves installed character data, `media.py` contains PCM frame splitting and the experimental paced media transport. The render CLI does not import FastAPI, aiortc, or `server.py`. `media.py` imports media-transport libraries lazily inside `tracks()`.

## Standalone tickets

A trusted external issuer signs HS256 JWTs using the shared `AVATAR_JWT_SECRET` (minimum 32 bytes). The renderer validates the signature and:

- `iss`: configured `AVATAR_JWT_ISSUER`, default `shiba-live`.
- `aud`: configured `AVATAR_JWT_AUDIENCE`, default `shiba-avatar`.
- `iat`, `exp`: valid current time and positive lifetime of at most 900 seconds.
- `sub`: opaque caller identity.
- `session_id`: nonempty string of at most 36 characters; `jti` matches this one-use allocation ID.
- `avatar_id`: installed package ID; the offer must match the loaded package.
- `permissions`: an array containing `avatar:render`.

No application membership claim is required or queried. The issuer owns admission checks. Extra opaque session metadata conveys no additional authority. A future container host may mint the identical ticket format. The pre-existing application ticket issuer in this draft does not yet emit `permissions`; adapting it is deliberately deferred until offline/local/remote render acceptance. Such tickets currently fail closed.

## Existing experimental signaling (frozen pending offline acceptance)

`GET /health` reports actual load status and nullable measured FPS. `POST /offer` with Bearer ticket and `{session_id, type:"offer", sdp}` allocates a scoped session and returns `{type:"answer", sdp}`. `/control` is an authenticated WebSocket for both PCM and control. This is the existing combined signaling equivalent, not the final accepted session API.

The first WebSocket message is `{type:"authenticate", session_id, token}` within five seconds; origin must be allowed. Current messages are `avatar.begin` (utterance ID, LEMO, PCM16/16k format), ordered sample-aligned binary PCM chunks of at most 16,000 bytes, `avatar.end`, `avatar.cancel`, and `avatar.state`. Audio is limited to 45 seconds. Offer tickets are one-use; expiry/disconnect closes the session. The renderer serializes inference and discards stale outputs after cancellation; already running CUDA kernels finish.

After offline acceptance, stabilize explicit session creation/deletion and the `start_utterance`, `audio_chunk`, `finish_utterance`, `interrupt` vocabulary, then implement `/test` before remote deployment. These endpoints/control aliases and the local test page are not yet implemented. Avoid client integration until that contract is validated.

## Audio and telemetry

Original 16 kHz mono PCM drives inference and media. A 25 fps video frame corresponds to 640 samples, sent as two 20 ms audio packets. Tracks share a paced timeline; only the returned native stream should play at a client. Network audio uses Opus; offline MP4 uses AAC. Neither path invokes a speech synthesizer.

Offline metrics distinguish model/frame computation from encoding and include first-frame latency, model load/warmup, source/audio hashes and PyTorch allocator VRAM peaks. GPU/CUDA and visual acceptance cannot be established on a CPU fixture. Shared timestamps alone do not prove perceptual synchronization. Streaming throughput includes backpressure and remains experimental; AV offset is unmeasured.

## Future host contract — documentation only

Future capability name: `native_avatar.render`.

Inputs: `character` (installed avatar ID), `audio_stream` (PCM16 mono 16 kHz), `emotion_stream` (normalized LEMO), `session_metadata` (opaque session/caller identifiers plus scoped ticket).

Outputs: `media_endpoint` (WebRTC signaling/media endpoint for the session), `telemetry` (actual GPU/load/FPS/latency/VRAM with null for unmeasured values), `status` (starting/ready/rendering/interrupted/failed/stopped).

The future host starts/stops **the exact same versioned Docker image**, allocates a GPU, injects ticket/routing configuration, routes traffic and monitors health. It does not absorb or rewrite inference code. No ShibaOS worker access, modification or skill implementation is part of the current work.
