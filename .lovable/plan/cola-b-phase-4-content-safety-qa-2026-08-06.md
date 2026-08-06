# Cola B — Phase 4: Content Safety + QA

Phases 1–3 are in (design system, assets, homepage, inner pages). Phase 4 is the safety net and the final quality pass. No redesign, no schema changes, no route changes.

## 1. Publishable guard

One shared helper `src/lib/publishable.ts` with small predicates:

- `isPublishableRelease` — needs title, artwork, release date, at least one platform link
- `isPublishableVideo` — needs id, title, thumbnail
- `isPublishableStory` — needs title, date, and either body or image
- `isPublishableProduct` — needs image, price, and availability

Applied at the render boundary in the music, release, videos, world/story, homepage shelves, store and product surfaces. Records that fail are filtered out rather than rendered as placeholders. Sections that end up empty hide themselves instead of showing "coming soon".

In dev only, a grouped `console.info` lists what was hidden and why, so gaps in the data are visible without leaking to visitors.

## 2. Empty and error states

Every data-driven section gets three defined states: skeleton while loading, hidden or curated fallback when empty, and a quiet inline message on fetch failure — never a raw error or a blank fixed-height block.

## 3. Copy and i18n sweep

- No raw i18n keys rendered anywhere (both languages, every route)
- No "coming soon" on music that is already released
- No disabled or dead platform links, no dead product links
- Bio facts consistent with the confirmed record on every page

## 4. Analytics events

Confirm the consent-aware events fire once each, with correct payloads: hero listen, platform click, release open, video play, story open, store visit, product click, chat open, newsletter submit, language change, press-kit download. No duplicate fires on re-render, nothing fires before consent.

## 5. Structured data and SEO

Per-page validation of MusicGroup, MusicAlbum, MusicRecording, VideoObject, Product and BreadcrumbList JSON-LD; single H1 per page; canonical and hreflang present and correct; alt text on every meaningful image; noindex where intended.

## 6. Accessibility and responsive QA

Playwright pass at 1920 / 1440 / 1280 / 1024 / 834 / 768 / 430 / 390 / 375 in EN and 繁, across every public route:

- WCAG AA contrast on the dark palette
- Visible focus states, full keyboard nav, 44px touch targets
- `prefers-reduced-motion` honoured
- No horizontal overflow, no clipped buttons, no cropped faces, no vertical Chinese breaking

## 7. Report

A summary of what was hidden by the guards, what copy or link issues were fixed, and screenshots of the routes that changed. Nothing published until reviewed.

## Technical notes

Frontend and presentation only. Shopify, chat auth and gating, AIPF, edge functions and all data fetchers stay untouched. New copy lands as i18n keys.
