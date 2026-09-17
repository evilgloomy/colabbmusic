# Worker architecture and protocol v1

`Supabase access check → short-lived scoped JWT → HTTPS offer → authenticated WSS control → shared media timeline → WebRTC audio + video`

- `security.py`: fixed HS256, issuer `shiba-live`, audience `shiba-avatar`, subject, expiry, 15-minute maximum lifetime, session/JTI and allowed avatar scope. No public renderer or admin API.
- `server.py`: access token on offer; token in first WebSocket frame (not URL). First message deadline and origin allowlist. One-time offer tickets; sockets bind to the same claims. Session limit, packet/utterance bounds and expiry cleanup. Renderer errors are normalized.
- `renderer.py`: renderer implementation only. Loads models and cached Cola package once, warms CUDA, uses audio conditioning to inpaint the face, returns frames. PyTorch work is outside the event loop; cancellation is generation-based because CUDA kernels cannot be safely stopped mid-kernel.
- `media.py`: original signed PCM at 16kHz, mono. Each 25fps frame maps to 640 samples; WebRTC sends two 20ms audio packets for each video frame. Audio PTS uses 1/16000, video PTS 1/90000; both share one paced tick. Silence and approved idle clip fill underruns. Queues stay bounded. Original PCM is not synthesized again or time-stretched; Opus encoding naturally changes the network representation.
- `tools/build_avatar.py`: offline frame/crop, geometric anchors, lower-face mask, color, motion and VAE latent cache.

## Control

1. `POST /offer` with Bearer JWT and `{session_id, type:"offer", sdp}`. Returns `{type:"answer", sdp}`; 503 means fall back.
2. Connect `/control` over WSS. Send `{type:"authenticate", session_id, token}`. Receive `avatar.ready`.
3. `{type:"avatar.state", state:"IDLE"|"LISTENING"|"THINKING"|"SPEAKING"}`.
4. `{type:"avatar.begin", id, emotion, format:"pcm_s16le", sample_rate:16000}`.
5. Ordered binary PCM messages of at most 16,000 bytes, always sample-aligned.
6. `{type:"avatar.end", id}` starts native inference. Server sends `avatar.speaking.started`, then `avatar.speaking.completed`, each scoped to utterance ID.
7. `{type:"avatar.cancel", id}` invalidates current work and clears synthesis/media queues. Browser also mutes remote media synchronously while cancellation travels to the worker.

Native rendering controls are distinct from producer interview controls. The worker has no access to the LLM prompt, biography, MiniMax credentials or producer notes.

## Observability

Health reports actual load status, GPU name when loaded, and nullable observed inference throughput. Control telemetry includes batch inference milliseconds, queue length and GPU. Client WebRTC stats provide received FPS and round-trip time. `av_offset_ms` remains null until instrumented/externally measured; shared timestamps alone do not prove perceptual sync. Browser voice-start timing is a playback-readiness/scheduling estimate, not an acoustic measurement. TTFT is absent because the brain request currently returns a complete short response.

## Deployment boundary

One uvicorn process per GPU. HTTPS proxy protects signaling; WebRTC uses ICE/STUN/TURN. Deploy edge orchestration separately. Browser receives only scoped session tokens and expiring TURN credentials. Static TURN worker credentials never leave the server.
