# EPIC 3 — Fan capture & streaming funnel (Tickets 301–305)

## TICKET-301 — Newsletter signup

**DB migration** (`subscribers` table):
- `id uuid pk default gen_random_uuid()`
- `email text not null unique` (case-insensitive via `citext`-style lower() check or store lowercased)
- `source text` (e.g. `footer`, `exit_modal`, `release_page`)
- `locale text` (`en` / `zh-HK`)
- `ip_hash text` (sha256 of IP — for soft abuse heuristics, not for tracking)
- `created_at timestamptz default now()`
- RLS enabled, **no public insert/select policies** — all writes go through the edge function with the service role.

**Edge function** `supabase/functions/subscribe/index.ts`:
- Public (verify_jwt off). CORS open.
- Validate body with zod: `{ email, source?, locale? }`.
- Lowercase + trim email; reject obviously malformed.
- Soft per-IP throttle: count rows in last 60 s where `ip_hash` matches; if >5, return 429. (Per the no-backend-rate-limiting rule, this is a lightweight ad-hoc heuristic only — not a true rate limiter.)
- Insert. On unique-violation (Postgres `23505`) return `{ ok: true, alreadySubscribed: true }` so the UI shows a friendly "you're already on the list" toast.
- ESP forwarding: optional. If `MAILCHIMP_API_KEY` + `MAILCHIMP_LIST_ID` env vars exist, POST to Mailchimp Members endpoint. Failures are logged but never block the success response (Supabase row is the source of truth). No new secret request unless the user wants ESP sync — the function gracefully no-ops when secrets are absent.

**Component** `src/components/marketing/EmailSignup.tsx`:
- Props: `source: string`, optional `variant: "inline" | "stacked"`, optional `headline`/`subhead`.
- shadcn `Input` + `Button`, loading spinner, sonner toast for success / already-subscribed / error.
- Calls `supabase.functions.invoke("subscribe", { body: { email, source, locale } })`.
- Fully i18n'd via existing `react-i18next` (new keys under `newsletter.*` in `en.json` and `zh-HK.json`).

**Integration**:
- `Footer.tsx`: insert `<EmailSignup source="footer" variant="stacked" />` as a new top section above the studio block, separated by a divider. Editorial styling — porcelain bg, charcoal text, no rounded corners (per core memory).

Optional exit-intent modal is left as a follow-up ticket (not built in this epic).

## TICKET-302 — Smart-link release page (without pre-save in v1)

**Schema**: `streaming_links` table already exists with `(release_id, platform, url)` rows. No schema change needed — we just enrich how existing rows render plus add a few static fallbacks.

**`src/lib/streaming.ts`**:
- Extend `PLATFORM_INFO` to cover the full DSP set: spotify, apple_music, youtube, youtube_music, amazon_music, tidal, deezer, soundcloud, bandcamp, pandora. Each entry: `{ label, color, icon (SVG path) }`. Add a `displayOrder` so buttons render in a consistent priority sequence (Spotify → Apple → YouTube Music → Amazon → Tidal → Deezer → SoundCloud → Bandcamp → others).
- Helper `parseSpotifyEmbedUrl(url)` → returns embed URL for Spotify oEmbed (`https://open.spotify.com/embed/...`).
- Helper `parseAppleMusicEmbedUrl(url)` → returns Apple Music embed URL.

**`src/pages/ReleasePage.tsx`**:
- Replace the existing 3-column platform grid with a vertical "smart-link" stack styled like a linktree: full-width branded buttons, each tinted with its platform color, in `displayOrder`. Each button click calls `trackReleaseClick({ release_id, platform })`.
- Above the buttons, embed a Spotify iframe (if a Spotify link is present) and an Apple Music iframe (if an Apple link is present). Lazy-loaded.
- New analytics helper `trackReleaseClick` in `src/lib/analytics.ts` emitting `gtag("event", "release_click", { release_id, platform })`.
- **Pre-save deferred**: Spotify pre-save and Apple MusicKit pre-add require app registration (Spotify Developer Dashboard + Apple Developer + MusicKit JWT signing) plus an OAuth callback edge function. That is genuinely 1+ day of integration work and needs credentials we don't have yet. Ship the smart-link + embeds now; create a follow-up ticket "TICKET-302b — pre-save flow" once the user registers the apps. The plan documents the exact gap; nothing fake or placeholder is shipped.

## TICKET-303 — Spotify Follow widget on home

- New `src/components/home/SpotifyFollow.tsx` — minimal section using Spotify's official artist iframe embed (`https://open.spotify.com/embed/artist/00rDJJmfKiMqxsGOuJmlzz?utm_source=generator&theme=0`) sized to compact (152px tall). Editorial heading "Follow on Spotify".
- Mount in `src/pages/Index.tsx` between `<HeroSection />` and `<CurrentEra />`.
- The iframe inherently provides the follow CTA — no extra JS needed.

## TICKET-304 — Centralized social/streaming icons

- `src/data/content.ts`: add a new `socialLinks` block exporting `{ spotify, appleMusic, youtube, youtubeMusic, tiktok, instagram, facebook, threads, soundcloud, bandcamp }`. URLs sourced from `mem://brand/official-presence` (X intentionally omitted — core memory rule).
- New shared SVG-icon map in `src/lib/socialIcons.tsx` (or extend `streaming.ts`) so the same brand SVGs render in nav, footer, and any future surface.
- `Footer.tsx`: replace the two-icon row with a full strip of platform icons; each link `target="_blank" rel="noopener noreferrer"` and calls `trackSocialClick(platform)`.
- `Navbar.tsx`: keep nav minimal — render only Instagram + Spotify on desktop, drop Facebook from the bar.
- New analytics helper `trackSocialClick(platform)` → `gtag("event", "social_click", { platform })` and FB Pixel `Lead` (light).

## TICKET-305 — Share buttons

- New component `src/components/share/ShareButtons.tsx`:
  - On mount, feature-detect `navigator.share`. Mobile (touch + share API present) → single "Share" button that opens native sheet via `navigator.share({ title, text, url })`.
  - Desktop / no native share → inline row with X (Twitter), WhatsApp, Telegram, Facebook, Copy Link buttons. Each calls `trackShareClick(platform)`.
  - Note: per core memory rule "Never link to 'X' (Twitter)". For the user's own brand pages we exclude X from social links — but for **share targets**, X/Twitter is a destination users may want to share to. Plan: **omit X here too** to be consistent with the brand rule. Keep WhatsApp, Telegram, Facebook, Copy Link, Email as fallbacks. Will confirm in implementation if user wants X added back as a share-only target.
- Embed in `ReleasePage.tsx` (under the smart-link buttons) and `StoryDetail.tsx` (under the article body).
- New analytics helper `trackShareClick(platform, contentType, contentId)`.

## Files touched

```text
new:    supabase/migrations/<ts>_create_subscribers.sql
new:    supabase/functions/subscribe/index.ts
new:    src/components/marketing/EmailSignup.tsx
new:    src/components/home/SpotifyFollow.tsx
new:    src/components/share/ShareButtons.tsx
new:    src/lib/socialIcons.tsx
edit:   src/components/layout/Footer.tsx
edit:   src/components/layout/Navbar.tsx
edit:   src/pages/Index.tsx
edit:   src/pages/ReleasePage.tsx
edit:   src/pages/StoryDetail.tsx
edit:   src/lib/streaming.ts
edit:   src/lib/analytics.ts
edit:   src/data/content.ts
edit:   src/i18n/en.json, src/i18n/zh-HK.json
```

## Out of scope for this epic (explicit deferrals)

- **Spotify pre-save / Apple MusicKit pre-add** (TICKET-302 second half): requires Spotify Developer app + Apple Developer + MusicKit token-signing edge function. Will be a follow-up ticket once you've registered those apps and shared the credentials.
- **Exit-intent modal with acoustic-download lead magnet** (mentioned as optional in TICKET-301): deferred — needs the actual audio file and a signed-URL delivery flow.
- **ESP integration**: function is built to forward to Mailchimp if `MAILCHIMP_API_KEY` + `MAILCHIMP_LIST_ID` env vars exist. We won't request those secrets unless you confirm you want to sync to a specific ESP.

## Acceptance checklist

- Submitting an email in the footer creates a row in `subscribers`; resubmitting the same email shows "you're already subscribed".
- Release page renders branded streaming buttons in a consistent order, embeds a Spotify (and Apple if present) player, and emits `release_click` GA events on click.
- Home page shows a Spotify follow widget between hero and current era.
- Footer shows the full platform strip; nav shows Instagram + Spotify; all external links open in new tabs and emit `social_click`.
- Release and story pages have a Share component — native sheet on mobile, button row on desktop — emitting `share_click`.

Approve to implement.
