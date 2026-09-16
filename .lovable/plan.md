# Cola B Live — Private Realtime Voice Interview MVP (Phase 1 plan)

A private, invite-only area at `/live` where a journalist speaks, Cola listens, and Cola replies out loud — with a separate producer console for control. Phase 1 ships the complete flow in MOCK MODE, with no real Aurora / LEMO / voice credentials required.

## 1. Can `/live` live inside this project?

Yes. The repo already runs two isolated "sub-products" inside the same app: the public Cola site and the AIPF institution area (`/aipf`, its own layout, its own theme scope `.aipf-root`, its own auth context, its own `aipf_`-prefixed tables and roles). `/live` follows exactly that proven pattern, so no subdomain is needed.

Guards on the public site: `/live` routes are `noindex`, excluded from `sitemap.xml` and `robots.txt`, not linked from the navigation or footer, and all styling is scoped under a `.live-root` class so nothing leaks into the public design. A subdomain is only worth it later if press guests must never see the main domain, or if audio/WebRTC hosting needs its own deployment.

## 2. Auth: reuse vs. isolate

Reuse (existing backend, same login system):
- The main Supabase client and its email/password sign-in.
- The role pattern proven by AIPF: roles in a dedicated table, read through a security-definer helper, never on the profile row.
- The route-guard pattern (`AdminGuard`) — a `LiveGuard` mirrors it.

Keep isolated:
- A separate `LiveAuthContext` and its own role table `live_user_roles` with ADMIN / PRODUCER / GUEST. AIPF roles grant nothing in `/live` and vice versa.
- No public signup at all: guests are created by an admin/producer as a per-session access grant. Guests never see a "create account" screen.
- Do not touch the second backend used by the fan chat (`artistAgent`) — `/live` uses the main project backend only.

## 3. Structure

```text
src/live/
  LiveAuthContext.tsx        sign-in, role, session guard
  LiveLayout.tsx             .live-root themed shell (Cola dark editorial)
  live.css                   scoped styles
  routes described below
  pages/Login.tsx  Lobby.tsx  Session.tsx  Producer.tsx
  components/  ColaStage.tsx  StateBadge.tsx  TranscriptView.tsx
               MicControls.tsx  ProducerConsole.tsx  LatencyPanel.tsx
               ContextInjector.tsx  ServiceStatusRow.tsx
  machine/     conversationMachine.ts   (explicit state machine + events)
  adapters/
    types.ts                 SpeechInputAdapter, AuroraAdapter, LemoAdapter, VoiceAdapter
    speech/browserSpeech.ts  speech/mockSpeech.ts
    aurora/mockAurora.ts     aurora/httpAurora.ts   (server-proxied)
    lemo/mockLemo.ts         lemo/httpLemo.ts
    voice/mockVoice.ts       voice/streamingVoice.ts
    registry.ts              picks mock vs real per env/session flag
  audio/  audioQueue.ts  vad.ts  playback.ts
  lib/  api.ts  latency.ts  types.ts
```

Routes: `/live/login`, `/live` (lobby + session setup), `/live/session/:sessionId` (guest), `/live/producer/:sessionId` (producer/admin). All lazy-loaded so the public bundle is unaffected.

Every adapter is a plain TypeScript interface with a mock and a real implementation; swapping a provider means registering a different module, never editing the state machine or UI.

## 4. Database and access rules

New tables, all `live_`-prefixed, RLS on, explicit grants:

- `live_user_roles` — user, role (ADMIN / PRODUCER / GUEST).
- `live_sessions` — title, media organization, interviewer name, primary language, topic, campaign, talking points, topics to avoid, unreleased info, approved announcements, music releases, notes, status, mock_mode flag, recording_enabled (default off), created_by.
- `live_session_participants` — which user may join which session and in what capacity.
- `live_messages` — turn-by-turn transcript: role (interviewer / cola / system), text, partial-vs-final, interrupted flag, timestamps.
- `live_context_injections` — producer instructions with scope ONE_TURN / UNTIL_REMOVED / ENTIRE_SESSION, kind (private steer vs. factual), active flag. Never returned to guest queries.
- `live_lemo_states` — per-turn emotion, valence, arousal, warmth, confidence, energy, speaking rate, pause before, delivery note.
- `live_latency_metrics` — per-turn speech-finalization, Aurora, LEMO, voice time-to-first-audio, total speech-end-to-first-audio.

Access rules in plain terms:
- Admins see and manage everything.
- Producers see and manage sessions they created or are assigned to, including injections, LEMO states and latency.
- Guests can read only their own session's guest-visible transcript, and cannot read injections, LEMO states, or latency at all — enforced in the database, not just in the interface.
- Writes to transcript/metrics come from server functions using the service role, so a guest browser can't forge turns.
- Raw microphone audio is never stored. Optional recording stays off unless explicitly enabled per session.

## 5. Server functions (secrets stay server-side)

- `live-session-start` — validates role/participation, creates or resumes a session, returns session config and short-lived credentials for the chosen speech provider (never raw keys).
- `live-turn` — the orchestrator: takes final interviewer text + session id, loads history and active injections, calls Aurora, then LEMO, writes the turn and metrics, returns reply text + delivery metadata. Retries Aurora once; falls back to neutral LEMO on failure.
- `live-voice` — streams synthesized Cola audio for a given text + voice id + emotional metadata; supports cancel.
- `live-control` — producer actions: stop, cancel response, force listening, clear context, add/remove injection, manual response, speak exact text, end session.
- `live-health` — per-service status for the producer console.

All four validate the caller's JWT and role in code, validate the body with Zod, and are the only place provider keys are read.

## 6. MOCK MODE

A session-level `mock_mode` flag plus an environment default, resolved server-side so the producer always knows what's real.
- Mock speech: browser speech recognition where available, otherwise a typed-input "simulate speech" box with synthetic partial/final timing.
- Mock Aurora: plausible short Cola replies (English and Cantonese variants), honouring injections and the 1–3 sentence interview rule, with a realistic simulated delay.
- Mock LEMO: emotional state derived from simple heuristics so the delivery panel is exercised.
- Mock voice: browser speech synthesis, with real streaming semantics — chunked queue, cancel, flush — so barge-in is genuinely testable.
- Everything mocked is badged in the producer console and in an admin-only banner; the guest view carries a discreet "rehearsal" marker so nobody mistakes a mock take for a live one.

## 7. Risks

- **Browser audio**: autoplay policies require the guest to press Start Conversation before any audio; mic permission failure, device switching, and Bluetooth latency all need explicit states. Safari/iOS is the weakest link — Phase 1 targets desktop Chrome for the real interview path.
- **Barge-in**: the hard part. Echo from speakers re-triggering the mic causes false interrupts; mitigation is echo cancellation, a short energy/duration threshold before declaring an interrupt, and configurable silence threshold 600–900 ms. Cancellation must reach the audio queue, the playback element, and the in-flight stream together, or Cola keeps talking after STOP.
- **Latency**: chaining speech → Aurora → LEMO → voice makes 1.5 s tight. Mitigations: start Aurora on a confident final transcript rather than waiting out full silence, run LEMO in parallel with the first voice chunk, and stream the first sentence rather than the whole reply. We measure rather than assume.
- **Auth**: guest links must not become public doors; short-lived grants, per-session participation checks, no signup route, `noindex`.
- **Deployment**: long-lived streaming inside edge functions has time limits; if a provider needs a persistent socket, the browser connects directly using a short-lived server-minted token rather than a raw key.

## 8. Recommended Phase 1 scope

1. Scoped `/live` shell, theme, routes, `noindex`, no public links.
2. Roles + tables + access rules, admin-created producer and guest grants, no signup.
3. Session setup form and lobby.
4. Full conversation state machine with all states and interruption handling.
5. Adapter interfaces plus all four mock adapters, wired end to end through the server orchestrator.
6. Guest view: Cola portrait/idle stage, state display, transcript, Start / End / Mute / Interrupt.
7. Producer console: live partial/final transcript, generated reply, LEMO panel, service status, latency panel, STOP COLA, cancel, force listening, replay, clear context, end session, injections with all three scopes, manual response, speak exact text.
8. Latency instrumentation and a measured baseline report in mock mode.

Not in Phase 1: real Aurora / LEMO / voice credentials, 3D avatar, payments, social features, recording storage, mobile-Safari hardening.

Assumption unless you say otherwise: Cola's voice provider is not yet chosen, so Phase 1 defines the interface and ships the mock; connecting the real one is Phase 2 with no UI rewrite.
