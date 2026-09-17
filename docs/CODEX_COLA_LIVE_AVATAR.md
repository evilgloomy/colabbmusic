# Codex Task — Cola Live Realtime Avatar

Work only on branch `codex/cola-live-avatar` in repository `evilgloomy/colabbmusic`.

## Objective

Replace the current `Editorial Portrait Placeholder` in Cola Live with a genuine realtime, moving, lip-synced Cola avatar while preserving the existing conversation stack:

`Mic -> Speech -> Aurora Lite -> LEMO Lite -> MiniMax Cola Voice -> Realtime Avatar`

This task is **not** a redesign of ShibaOS, Aurora, LEMO, auth, Supabase, the public Cola B site, or the MiniMax voice layer.

## Provider

Use **HeyGen LiveAvatar LITE mode** as the first concrete realtime-avatar provider because LITE mode allows us to keep our own intelligence and TTS stack and send external audio to the avatar.

Use the official LiveAvatar Web SDK. Current SDK package: `@heygen/liveavatar-web-sdk`.

If running Codex locally, install/read HeyGen's official agent skill first:

```bash
npx skills add heygen-com/liveavatar-agent-skills
```

Then follow the `liveavatar-integrate` skill and current LiveAvatar docs rather than inventing API shapes.

## Critical product rule

**MiniMax remains Cola's voice identity.**

Do not use a generic HeyGen/LiveAvatar voice. The exact MiniMax-generated audio that represents Cola must drive the avatar lip sync. Aurora Lite decides what she says. LEMO Lite controls delivery metadata. MiniMax generates Cola's voice. LiveAvatar renders her face/body.

## Current repo state

Inspect before editing:

- `src/live/pages/LiveRoom.tsx`
- `src/live/lib/useLiveConversation.ts`
- `src/live/components/LiveColaAvatar.tsx`
- `src/live/lib/avatar.ts`
- `src/live/adapters/voice/minimaxVoice.ts`
- `src/live/adapters/registry.ts`
- `supabase/functions/cola-voice/index.ts`
- `supabase/functions/live-health/index.ts`

The current `LiveColaAvatar` is intentionally a still editorial portrait with audio-reactive lighting. Keep that as the fallback provider.

## LiveAvatar LITE integration

Create a server-side Supabase Edge Function such as:

`supabase/functions/liveavatar-session/index.ts`

It must:

1. Require a valid Supabase JWT.
2. Never expose the LiveAvatar API key.
3. Read these server-side secrets:
   - `LIVEAVATAR_API_KEY`
   - `LIVEAVATAR_AVATAR_ID`
   - optional `LIVEAVATAR_SANDBOX`
4. Create a short-lived LiveAvatar LITE session token using the current official LiveAvatar session-token API.
5. Return only the short-lived session token/session metadata required by the browser.
6. If secrets are missing, return a clean `not_configured` state rather than crashing Cola Live.

Do not hardcode the API key or avatar ID in client code.

## Client avatar abstraction

Create a provider-agnostic realtime avatar adapter, e.g.:

`src/live/avatar/realtimeAvatar.ts`

with a contract conceptually like:

```ts
type RealtimeAvatarStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'speaking'
  | 'fallback'
  | 'error';

interface RealtimeAvatarAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  attach(element: HTMLMediaElement): void;
  speakAudio(audio: AudioBuffer | ArrayBuffer): Promise<void>;
  interrupt(): void;
  startListening?(): void;
  stopListening?(): void;
  getStatus(): RealtimeAvatarStatus;
  subscribe(listener: () => void): () => void;
}
```

Keep this interface independent of HeyGen so Live2D, WebGL, Unreal or another realtime provider can replace it later.

## LiveAvatar audio requirement

The official LiveAvatar LITE audio command consumes raw 24 kHz signed 16-bit mono PCM.

MiniMax currently returns/streams MP3 audio. Add a clean conversion layer:

`MiniMax MP3 -> AudioBuffer -> mono/resample 24 kHz -> PCM16 -> LiveAvatar repeatAudio`

Important:

- Do not call LiveAvatar `repeatAudio()` separately for arbitrary tiny MiniMax network chunks if that causes a `speak_end` after every chunk.
- For the first reliable version, a whole short Cola utterance may be assembled and then sent to `repeatAudio()` once.
- Cola's interview answers are deliberately short, so reliability is more important than shaving the last few hundred milliseconds immediately.
- Structure the conversion separately so a lower-latency incremental PCM path can be added later.

Create a focused utility such as:

`src/live/avatar/audioPcm.ts`

and unit-test PCM conversion/resampling assumptions.

## Audio authority / no double voice

When LiveAvatar is connected successfully:

- Send MiniMax Cola audio into LiveAvatar.
- Let the LiveAvatar remote media stream be the audible/rendered output so video and audio stay synchronized.
- Do not also play a second local copy of the same MiniMax audio at full volume.

When LiveAvatar is unavailable:

- Continue using the existing local MiniMax playback.
- Only use browser TTS if MiniMax itself fails.
- The conversation must remain usable even if the avatar provider is down.

## UI

Update `LiveColaAvatar` so:

- connected realtime provider -> show the LiveAvatar `<video>`/media surface
- connecting -> retain the editorial portrait with a subtle connecting state
- unavailable/error -> editorial portrait fallback
- never fake mouth movement with CSS
- do not show technical/provider language in the guest view

The existing status line may continue to show Ready / Listening / Thinking / Speaking.

## Conversation lifecycle

Integrate the realtime avatar into `useLiveConversation`:

### Start Conversation

Start/connect LiveAvatar in parallel with the existing microphone setup. Avatar connection failure must be non-fatal.

### Cola speaks

After Aurora Lite + LEMO Lite produce the response and MiniMax creates Cola's audio:

- if realtime avatar connected: send the same Cola audio to LiveAvatar and transition to speaking from real avatar events/media readiness
- otherwise: use current local MiniMax playback

### Barge-in / STOP COLA

All stop paths must cancel both sides:

- current MiniMax/local audio queue
- LiveAvatar speaking/animation via its interrupt command

This includes:

- guest `Interrupt`
- producer `STOP COLA`
- `cancel_response`
- `force_listening`
- normal End Session cleanup

The avatar must not continue talking after audio is cancelled.

## Diagnostics

Staff-only diagnostics may show:

- Avatar provider: `LiveAvatar LITE — Cola B`
- status: connecting / online / fallback / error
- `LiveAvatar API key configured: yes/no`
- `LiveAvatar avatar ID configured: yes/no`
- avatar session/connect latency if measurable

Never return or display the actual API key or avatar ID.

Update `live-health` accordingly.

## Existing systems that must remain intact

Do NOT remove or replace:

- Aurora Lite
- LEMO Lite
- MiniMax Speech 2.8 Turbo Cola voice
- browser speech / typed fallback
- Supabase auth/RLS
- producer console
- session/transcript handling
- public website
- editorial portrait fallback

Do not touch unrelated public routes.

## Testing

Run at minimum:

```bash
bun install
bun run test
bun run build
```

or the repository-equivalent commands without deleting existing lockfiles unnecessarily.

Add focused tests for:

1. PCM conversion produces mono PCM16 data suitable for 24 kHz LiveAvatar input.
2. Missing LiveAvatar configuration leaves Cola Live on portrait + local MiniMax voice.
3. Avatar `interrupt()` is invoked when Cola is interrupted.
4. Disconnect cleanup happens on End.
5. No provider secret appears in frontend bundle/source.

If credentials are available in the execution environment, also perform one real LiveAvatar LITE session test. If credentials are not available, do not pretend a live session was tested.

## Acceptance criteria

The feature is complete when:

1. A configured LiveAvatar session displays a genuinely moving Cola video stream.
2. Cola's MiniMax voice drives the avatar lip sync.
3. The user hears one synchronized Cola voice, not duplicate audio.
4. Interrupting Cola stops audio and avatar motion promptly.
5. Avatar failure falls back to the editorial portrait while MiniMax voice/chat continues.
6. Aurora Lite, LEMO Lite and MiniMax remain unchanged in responsibility.
7. Typecheck/tests/build pass.
8. No API keys are exposed client-side.
9. Changes are committed to `codex/cola-live-avatar` and opened as a PR to `main`.

After review, merge to `main`. Lovable is GitHub-connected, so the merged source should then appear in the Lovable project without rebuilding this feature inside Lovable.