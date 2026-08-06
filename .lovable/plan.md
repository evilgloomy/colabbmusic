# Cola B — Full Visual Revamp

## Audit findings (verified against the codebase)

**Working and to be preserved as-is**
- Routes: `/`, `/music`, `/release/:id`, `/story`, `/story/:id`, `/videos`, `/store`, `/product/:handle`, `/press`, `/chat`, `/about-cola`, `/privacy`, `/terms`, `/policies`, `/lovevibevol5`, plus the whole `/aipf` app (public + admin).
- Data layer: `src/lib/youtube.ts` (releases + video feed), Shopify Storefront (`src/lib/shopify.ts`, `cartStore`, `useCartSync`), dual Supabase clients (main + `artistAgent` for chat), edge functions for sync/sitemap/subscribe.
- Cross-cutting: `useSEO` (titles, OG, canonical, hreflang, JSON-LD, noindex), `usePageTracking` + `src/lib/analytics.ts` (GA4 + Pixel), i18n EN / zh-HK, cookie consent, `EmailSignup`, `ShareButtons`, `socialIcons`.

**What is actually weak (the work)**
- `index.css` is a light porcelain theme with no editorial scale, no dark surfaces, no motion tokens.
- Homepage is a stack of card modules (`HeroSection`, `SpotifyFollow`, `CurrentEra`, `FeaturedMusic`, `StoryPreview`, `FeaturedVideo`, `StorePreview`, `PressPreview`) — a catalogue, not a story.
- Only one Cola asset exists (`hero-cola-b.png`); no responsive crops, no art direction.
- Nav shows "Story", "Press", "AIPF" in the primary bar; brief wants World / About / Talk to Cola, with AIPF demoted to the footer.
- Empty/partial states leak ("Stories coming soon", empty video grid, disabled platform links).

**Conflict noted:** project memory records a porcelain-white / charcoal palette. The brief supersedes it with the dark ink editorial system. On approval I will update that memory so future sessions don't revert it.

## Design system (Phase 1)

Replace the token layer in `index.css` + `tailwind.config.ts` with the brief's palette as HSL semantic tokens: ink `#0a0910`, surface `#121019`, surface-soft `#1a1722`, paper `#f7f3f0`, pearl, wine `#5d1538`, pink `#e2498b`, blush, aurora `#b995ff`, silver. Dark is the default surface; paper is used for the intimate "Hello" band.

Typography: Bodoni Moda (display Latin) + Noto Serif TC (editorial Chinese) + Noto Sans TC / Inter-class sans for UI. Type scale exactly as specified (`clamp(4rem,12vw,10rem)` hero down to 12–14px metadata labels). Sora is retired.

Layout + motion tokens: 1440px editorial max, 680–760px reading column, 96–160px section rhythm, no rounded cards, full-bleed image bands, opacity+translate reveals under 400ms, `prefers-reduced-motion` honoured globally.

## Asset pipeline (Phase 1)

Upload the 7 approved Cola images via the CDN asset pipeline, plus purpose-made desktop / tablet / mobile crops with explicit focal points per breakpoint. A small `<EditorialImage>` component handles srcset, width/height, lazy vs eager, and focal positioning. No substitute person, no filters that alter her face, no baked-in text.

Assignment: purple-glow → desktop hero; vertical portrait crop → mobile hero; velvet lounge → "Hello 我係 Cola B"; recording studio → "Why I make music"; neon rain city → "Beyond the songs"; cosmic plum → store band; magenta glamour → Talk to Cola; burgundy beauty → closing statement. Remaining images seed the About / Press / Music / World heroes. No image repeats in adjacent sections.

## Homepage (Phase 2)

Rebuild `src/pages/Index.tsx` as 11 discrete section components in `src/components/home/`, using the brief's exact EN and zh-HK copy (added as `home.*` i18n keys, not hardcoded):

1. Full-screen campaign hero — COLA B, "A world that began with a song", dual CTA, no autoplay
2. Hello, I'm Cola B — first-person, paper band, large warm portrait
3. Current era — dominant latest release from existing release data + secondary strip
4. Why I make music — studio image, first-person copy
5. Music universe — curated shelves (Latest, Essential, Albums & Eras, by language, SoftMind, Lo-fi) from the existing catalogue
6. Beyond the songs — magazine hierarchy over existing story data
7. Proof of scale — stats read from config, not hardcoded in JSX
8. Videos — one hero VEVO video + supporting grid, click-to-load embeds, curated fallback
9. Aurora by Cola B — up to 4 curated products, unavailable auto-hidden
10. Talk to Cola — chat + newsletter CTAs, transparent AI wording
11. Closing — "This is only the beginning / 呢個只係開始"

Navigation and footer are rebuilt in the same phase: Music / World / Videos / Store / About + language toggle + socials + Talk to Cola button; mobile menu, 44px targets, optional floating Talk-to-Cola pill; AIPF moves into a footer "Projects" group. `/story` URLs stay intact — only the label changes.

## Inner pages (Phase 3)

- **About** (`/about-cola`) — first-person editorial rewrite with timeline, large photography
- **Press** — real media room: 25/75/long bios, facts, milestones, press images, assets, contact, press-kit download; no invented coverage
- **Music** — same data, new hierarchy, filters, card design, mobile shelves
- **Release detail** — artwork presentation, hook, platform links, credits, tracklist, related story/video, next release
- **World** (`/story`) — editorial presentation, empty categories hidden
- **Videos** — curated + fallback, never a bare empty state
- **Store / Product** — Shopify logic untouched, editorial presentation and availability handling
- **Chat** — page redesign and clearer explanation only; auth, memory, consent, gating untouched
- **404** — branded

## Content safety and QA (Phase 4)

A shared `isPublishable()` guard hides records missing artwork, title, date, or links instead of rendering placeholders; a dev-only owner-action report lists what was hidden. Sweep for raw i18n keys, "coming soon" on released music, dead product links, disabled platform icons.

QA pass: every route, both languages, 375 / 390 / 430 / tablet / desktop, focus states, WCAG AA contrast on the dark palette, keyboard nav, reduced motion, consent-aware analytics events (hero listen, platform click, release open, video play, story open, store visit, product click, chat open, newsletter submit, language change, press-kit download), structured data (MusicAlbum, MusicRecording, VideoObject, Product, BreadcrumbList), canonical + hreflang.

## Technical notes

No new backend tables and no schema migrations — every section reads from the existing fetchers. No route deletions or renames. Homepage stays composed of small section components rather than one file. Data-driven sections get skeletons and error boundaries. New dependencies limited to the fonts.

## Delivery

Phases 1 and 2 (design system, assets, navigation, footer, full homepage) land first so the direction is visible end-to-end. Phase 3 (inner pages) and Phase 4 (safeguards + QA, screenshots, final change report) follow in subsequent passes. Nothing is deleted before the replacement is in place.
