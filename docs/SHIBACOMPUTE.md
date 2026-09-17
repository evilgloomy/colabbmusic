# Cola Live native avatar integration

Review candidate: **GPU RENDER UNVERIFIED**. Source integration exists; the
website, Edge Function, public compute/TURN and physical worker have not been
deployed or jointly verified.

## Configure and deploy

The Supabase function shiba-compute-session requires SHIBA_COMPUTE_API_URL
(an HTTPS origin) and SHIBA_COMPUTE_API_KEY. Store them as Supabase server
secrets, never VITE variables. It validates the Supabase user and exact Live room
access using live_guest_session_view, then creates a digital_human.avatar.realtime
session for cola_b. The browser receives four fields: session_id, session_token,
signaling_url and expires_at.

The reviewed ShibaOS gateway must allow client=colabbmusic, character=cola_b and
the actual website origins. Worker identity, GPU location, master credentials
and renderer paths are never browser inputs. The browser discovers readiness
and temporary ICE servers via its scoped session URL, and offers through the
gateway. Production uses TURN relay to preserve worker network privacy.

Deploy shiba-compute-session and the frontend together. Retire the old
liveavatar-session deployment/credentials. Its source and the remote hosted
avatar SDK import have been removed. The historical CODEX_COLA_LIVE_AVATAR
document is superseded.

## Audio and fallback

Aurora Lite and LEMO remain here. cola-voice requests MiniMax Speech 2.8 Turbo
with the configured Cola voice ID server-side. The frontend decodes a complete
utterance once, normalizes to signed PCM16LE mono 16kHz, and paces 20ms binary
chunks over shiba-avatar-control. This is a deliberate bounded MVP and adds
full-utterance TTS startup latency. No MP3 fragments reach MuseTalk.

Native success plays the one remote A/V stream. On avatar failure the client
closes remote media before local playback of the original decoded MiniMax audio,
with the editorial portrait. Aurora/interview state continues. Browser TTS is
used only when MiniMax fails (or the existing explicit development override is
set), and staff diagnostics show fallback active/inactive and provider state.
The actual voice ID is never displayed. Missing browser speech support is an error.

Interrupt sends utterance.cancel and waits for the renderer acknowledgement;
it stops further PCM transmission. HTTP interrupt is a fallback if the channel
cannot send. Disconnect aborts work, closes tracks/peer and sends authenticated
DELETE. Late session grants after disconnect are also deleted. Session expiry
falls back after ten minutes by default; renewal/migration are outside this MVP.

## Checks and remaining gates

Use bun install --frozen-lockfile, bunx tsc --noEmit -p tsconfig.app.json,
bun run test and bun run build. The maintained dependency source is bun.lock;
the stale npm package-lock is preserved. Global ESLint failures exist on main.

Tests cover exact-room authorization, safe grant fields, failed session fallback,
late grant cleanup, 16kHz PCM conversion, cancellation and no duplicate local
audio when native media succeeds. Staff diagnostics separate control plane,
worker, GPU, capability, renderer, model, avatar package and WebRTC status.

Still required on the deployed system: real Supabase-to-compute authorization,
public TURN/TLS, 4080 Docker/CUDA/model/package qualification, real browser media,
and MiniMax Cola saying 「Hello 我係 Cola B 今日第一次真係可以同你 live 傾計」.
Inspect voice identity, generated Cola face, lip sync, duplicate audio and
barge-in. No claim of real Cola visual/voice verification is made.
