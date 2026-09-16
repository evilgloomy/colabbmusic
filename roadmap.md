# Roadmap

## Cola Live (private interview MVP) — Phase 1
- [ ] Database: live_ tables, roles, RLS, grants
- [ ] LiveAuthContext + guards (ADMIN / PRODUCER / GUEST), no public signup
- [ ] Routes: /live/login, /live, /live/session/:id, /live/producer/:id
- [ ] Conversation state machine
- [ ] Adapters: SpeechInput, Aurora, LEMO, ColaVoice (+ mocks)
- [ ] Audio queue with cancel/flush + barge-in
- [ ] Producer console: controls, injections, LEMO panel, latency, service status
- [ ] Edge functions: live-turn, live-control, live-health
- [ ] noindex, scoped .live-root styles, no public links
- [ ] Run checks and fix errors

## Later
- Phase 2: real Aurora / LEMO / Cola Voice providers
