# Cola B / Shiba digital-human MVP

## Status

Implementation branch: `codex/cola-shiba-mvp`. **Not production complete.** Runtime and service tests can run without provider keys. Real OpenAI/MiniMax calls, CUDA rendering, visual approval, external TURN and the requested 10-minute conversation require deployment credentials, an NVIDIA GPU host and approved source media. Do not merge/promote based only on mocks.

**Architecture correction:** The next gate is an offline MP4 from the approved Cola source and real Cola MiniMax WAV on CUDA. Website integration is frozen until offline, local-page and remote-container acceptance. The existing ShibaOS worker is unrelated; the same standalone image may be hosted there in the future. See `services/cola-avatar-engine/README.md` for the current runnable command and deferred work.

## Architecture

Browser microphone → server Aurora Lite context → configured LLM → LEMO Lite → MiniMax trained Cola voice → standalone native renderer → one synchronized WebRTC stream. If native rendering is unavailable, the browser uses the same MiniMax PCM with the existing editorial portrait. If MiniMax fails, it uses emergency browser speech and the portrait. No hosted avatar service is used.

`src/shiba/digital-human/` owns provider contracts, session lifecycle, turn cancellation, events, error normalization, telemetry and audio authority. React (`useLiveConversation`) subscribes and forwards producer commands. `src/live/runtime.ts` injects the Supabase transport and Cola package configuration. Brain, emotion, voice and avatar remain separate.

## Brain / Aurora / LEMO

`OpenAIBrainProvider` uses the official server-side Responses API; default `gpt-5.6-luna`, reasoning `none`, short output budget, `store:false`. [Model documentation](https://developers.openai.com/api/docs/models/gpt-5.6-luna), [Responses API](https://developers.openai.com/api/reference/typescript/resources/responses/methods/create).

Selection is configured primary (default OpenAI), optional Lovable gateway, then deterministic localized Aurora fallback. Each remote attempt has an 8-second timeout. Diagnostics report the provider and model that actually answered. No Grok integration is present.

Canonical identity remains `supabase/functions/_shared/cola-aurora-lite.json`, v0.3.0. Profile/producer/private context is assembled server-side. Deterministic fallback uses approved localized lines and does not append raw producer text. LEMO Lite stays in `_shared/lemoLite.ts`; its normalized state is consumed independently of MiniMax. The model is instructed to speak natural short Hong Kong Cantonese.

## Voice / avatar / cancellation

MiniMax `speech-2.8-turbo` keeps `MINIMAX_VOICE_ID`. New runtime requests mono PCM at 16kHz; existing MP3 callers remain compatible. MiniMax's streaming response is forwarded server-side and cancelled on downstream abort. PCM avoids independently decoding fragmented MP3 frames. [MiniMax HTTP documentation](https://platform.minimax.io/docs/api-reference/speech-t2a-http).

Only the native stream plays when native rendering is ready. On failure, remote tracks are closed before local PCM playback. If failure happens mid-utterance, the retained utterance may replay from its beginning locally; this is explicit, and never simultaneous double audio. Runtime generation/abort checks prevent stale replies after interruption. Browser recognition uses `onspeechstart` as well as interim-result fallback; actual barge-in latency depends on browser speech detection and must be measured. A headset is recommended for acceptance to avoid speaker echo being recognized as interviewer speech.

Worker source, asset-cache tooling, deployment and license audit live in `services/cola-avatar-engine/`. The native path currently collects a complete short utterance before inference; rolling-window conditioning is remaining latency work.

## Server configuration

```dotenv
AURORA_LITE_PROVIDER=openai
AURORA_LITE_MODEL=gpt-5.6-luna
OPENAI_API_KEY=server-only
LOVABLE_API_KEY=optional-server-only
AURORA_LITE_FALLBACK_MODEL=google/gemini-2.5-flash
MINIMAX_API_KEY=existing-server-only
MINIMAX_VOICE_ID=existing-trained-cola-voice
MINIMAX_MODEL=speech-2.8-turbo
AVATAR_JWT_SECRET=32-or-more-random-bytes
AVATAR_ENGINE_URL=https://your-standalone-gpu-host
AVATAR_STUN_URL=stun:your-coturn-host:3478
AVATAR_TURN_URL=turn:your-coturn-host:3478
AVATAR_TURN_SECRET=coturn-static-auth-secret-server-only
```

Browser env remains the existing public Supabase URL and publishable key. Never define a VITE provider secret. TURN uses short-lived coturn REST browser credentials; the worker can use its own static `AVATAR_TURN_USERNAME/PASSWORD` configured only on that host.

`native-avatar-session` authenticates the user, checks staff or membership in the exact live session, rejects ended sessions and signs a 15-minute audience/issuer/character-scoped JWT. The service now additionally requires `permissions: ["avatar:render"]`. The existing draft application issuer has not been adapted; its tickets fail closed until integration resumes after GPU acceptance. JWT secrets, voice IDs and provider keys never enter frontend source or bundles. No auth/RLS tables were rewritten. Producer commands are signed by the staff-only `live-control` issuer and verified for session/expiry before execution; unsigned/replayed commands are discarded. The existing broadcast topology remains for non-secret transcript/state observation.

## Deployment order and acceptance

1. First run `tools/test_render.py` with approved source cache and real voice WAV on CUDA; inspect the MP4 and record GPU, CUDA, load time, FPS, VRAM, latency and visual issues. Only after success implement the localhost:8000 test page, then deploy the same container to any accessible NVIDIA host and verify it from another computer. ShibaOS is not involved.
2. Configure server secrets through authorized Supabase administration, never via frontend env.
3. Run all checks, review the PR, and perform authenticated staging acceptance using the Cantonese question from the brief. Test interruption during brain generation, synthesis and playback; measure at least 10 minutes on GPU. Record actual FPS, AV offset, speech-to-audio and perceived interruption.
4. Merge to `main` only after acceptance and CI pass. Lovable consumes GitHub source as-is. Verify its synchronized SHA equals the merge commit; do not ask its AI agent to regenerate code.
5. Deploy `live-turn`, `cola-voice`, `live-health`, `native-avatar-session`, `live-control` to the configured Supabase project. Remove the obsolete hosted-avatar function deployment and its secrets through authorized administration. GPU deployment remains separate. Smoke-test the live domain after edge deployment.

Example CLI (requires authorized account): `supabase functions deploy native-avatar-session --project-ref tfcrxvnfuagmqwkxoyei`, repeated for the other functions. The CLI/deployment token is not available in this development environment.

## Validation and limitations

- Frontend: typecheck, unit tests, production build, dependency-boundary/secret-pattern scan.
- Worker: PCM fidelity/padding, shared timestamps, cancellation queues, state motion bounds, JWT expiry/scope/tampering, offline health, unauthorized offer/origin rejection, real CPU WebRTC peer lifecycle.
- License check: immutable model revisions and audited inference-only allowlist; includes actual model-card license distinctions.
- GPU throughput, acoustic onset, perceptual lip/audio sync, external network interruption and 10-minute stability: **unmeasured**.
- Brain TTFT and first generated moving frame are not reported as measured; current brain provider is non-streaming. Native playback onset is an estimate based on server start and browser playback readiness. Producer displays missing metrics as unmeasured.
- Current state motion is an approved clip loop with restrained speed mapping, not generated state-specific nod/gaze behavior. Crop/mask quality requires artist review.

See `SHIBAOS_MIGRATION.md` for the exact portable modules and remaining full-Aurora/ShibaOS work.
