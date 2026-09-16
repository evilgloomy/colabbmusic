# Roadmap

## Cola Live (private interview MVP) — Phase 1 ✅
- [x] Database: live_ tables, roles, RLS, grants
- [x] LiveAuthContext + guards (ADMIN / PRODUCER / GUEST), no public signup
- [x] Routes: /live/login, /live, /live/session/:id, /live/producer/:id
- [x] Conversation state machine
- [x] Adapters: SpeechInput, Aurora, LEMO, ColaVoice (+ mocks)
- [x] Audio queue with cancel/flush + barge-in
- [x] Producer console: controls, injections, LEMO panel, latency, service status
- [x] Edge functions: live-turn, live-health
- [x] noindex, scoped .live-root styles, no public links
- [x] Typecheck + build clean

## Later
- Phase 2: real Aurora / LEMO / Cola Voice providers (swap in `src/live/adapters/registry.ts`)
- Guest invite UI (currently guests are added to a session by an admin)
- Transcript history reload after refresh (transcript is in-memory per session run)
- Mobile Safari audio unlock hardening

## Cola Live — Aurora Lite revision (2026-09-16)
- [x] Aurora Lite server engine + canonical JSON profile (supabase/functions/_shared/cola-aurora-lite.json)
- [x] LiveColaAvatar with breathing/blink/state/amplitude reactions
- [x] Simplified guest room UX; producer labels engine as Aurora Lite
- [x] VoiceStudio adapter + edge proxy stub; browser TTS renamed Browser TTS Placeholder
- [ ] Blocked: VoiceStudio API spec needed to finish audio streaming + real amplitude
- [ ] Replace SAMPLE placeholders in the Aurora Lite JSON with verified facts
