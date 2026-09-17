# Future ShibaOS hosting contract

ShibaOS is a future host, not an MVP dependency. Do not access or modify its existing worker for this project. The first deployment can use any accessible NVIDIA development machine or cloud CUDA VM running our own container and models.

## Same image, same service

`services/cola-avatar-engine/` is a standalone Docker build context. Its complete render, asset preparation, model provenance, auth and transport code stays inside that service. Later, ShibaOS starts the exact same versioned image; it does not receive copied inference logic or require a renderer rewrite.

A future host supplies GPU devices, ports, secrets, routing and health monitoring, and can start/stop the service. It may issue the same scoped avatar tickets as any other trusted issuer. No host-specific callback or API is required inside the engine.

## Future skill: native_avatar.render (not implemented)

| Direction | Field | Contract |
| --- | --- | --- |
| Input | character | Installed avatar package ID |
| Input | audio stream | PCM16 mono 16 kHz, ordered utterance chunks |
| Input | emotion stream | Normalized LEMO state |
| Input | session metadata | Session/caller identifiers and scoped short-lived ticket |
| Output | WebRTC media endpoint | Signaling location and session media connection |
| Output | telemetry | Measured GPU/load/FPS/latency/VRAM; unmeasured values null |
| Output | status | Starting, ready, rendering, interrupted, failed, stopped |

This is documentation only. Final streaming API acceptance follows offline CUDA success; see the service's `ARCHITECTURE.md` for implemented versus deferred behavior.

## Current gates

1. Real approved Cola source + actual Cola MiniMax WAV produce an offline CUDA MP4; record metrics and inspect lip sync/appearance.
2. Local `/test` page on port 8000 proves WAV playback, Interrupt and telemetry.
3. Same image on an accessible NVIDIA host passes testing from another computer.
4. Connect the website, verify a single audio authority and interview behavior, then consider production acceptance.
5. Later host the identical image under ShibaOS.

## Application runtime remains separate

`src/shiba/digital-human/` contains the draft portable browser session/providers. The website continues owning microphone/STT, Aurora, OpenAI, LEMO and MiniMax. Cola biography, interview state, backend admission and provider credentials stay outside the GPU service. No new website integration or runtime abstraction work proceeds before the offline render succeeds.
