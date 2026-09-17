# Extracting the first Shiba digital-human runtime

## Already portable

Copy `src/shiba/digital-human/` into a TypeScript package with ES2020 + DOM types. It imports no React, router, Supabase, Lovable, Cola profile or application aliases. Export the contracts, `DigitalHumanRuntime`, `DigitalHumanSession`, and providers from the package entry point. Tests cover lifecycle, cancellation, normalized errors, telemetry, one audio authority and fallback.

The browser-facing `BrainProvider` supplies the Aurora session contract. `AuroraLiteBrainAdapter` accepts an injected turn transport; a future `ShibaOSAuroraAdapter` implements the same interface. `EmotionProvider` currently normalizes server-supplied LEMO Lite output; full LEMO can replace it. `SpeechProvider` streams PCM; MiniMax can be replaced by Shiba Voice with identical PCM format or an explicit resampling adapter. `AvatarProvider` wraps the generic authenticated native protocol; it does not expose MuseTalk.

Keep the server-side language-engine `BrainProvider` (`supabase/functions/_shared/brainProviders.ts`) separate from the browser Aurora adapter. It accepts a system prompt, never owns Cola identity, and currently supports OpenAI Responses and the optional Lovable gateway. Move it and Aurora context assembly into the future Shiba backend. Inject environment reads and storage/auth dependencies rather than carrying Deno globals into the package.

Move `services/cola-avatar-engine/` as a separately deployed GPU module. Keep `renderer.py` as one backend implementation and preserve the WebRTC/control protocol when changing rendering models. Keep pinned weight provenance and notices with the service.

## Cola-specific composition to keep outside the package

- `src/live/runtime.ts`: Cola character declaration and Supabase transports.
- `supabase/functions/_shared/cola-aurora-lite.json`: server-only biography/profile v0.3.0.
- Server MiniMax voice secret and the `cola_b` avatar package/cache.
- Live interview producer UI, transcript persistence, route/session admission and editorial portrait.

## Remaining migration work

1. Add package entry points, versioning/build/export map and publish workflow in ShibaOS.
2. Implement Aurora's persistent memory, retrieval and private-context authorization behind the existing turn interface.
3. Replace LEMO Lite heuristics with full LEMO and retain normalized delivery metadata.
4. Replace the Supabase composition transports/auth-ticket issuer and transcript store with ShibaOS services.
5. Generalize server avatar allowlist/package loading and voice selection to more characters. Current deployment intentionally admits Cola only.
6. Add rolling audio-conditioning windows, distributed GPU capacity/leases, token refresh/reconnection and multi-session inference scheduling after real GPU profiling.
7. Finish source-motion art direction (nod/gaze clips), per-frame crop alignment and audiovisual calibration; current source-loop speed mapping is a restrained first pass.
8. Move signed producer-control issuance/verification (`live-control`) to ShibaOS authorization; retain session binding, expiry and replay suppression.

Migration is moving modules and replacing injected adapters; React should continue using session events and commands.
