

# Cola B Official Website Rebuild Plan

## Current State

The site is a basic Shopify storefront with a coffee-themed design: homepage with hero + product grid, product detail page, cart drawer, and navbar. It needs to be completely reimagined as a premium artist headquarters.

## What This Plan Covers: Phase 1

Given the scale of this spec, this plan covers **Phase 1** — the foundation that transforms the site from a store theme into an artist world. Phase 2+ (Videos page, era pages, AI campaign engine, Supabase content layer) will follow once Phase 1 is solid.

### Phase 1 Scope
- Complete visual rebrand (dark premium aesthetic, new typography)
- New site navigation (Home, Music, Story, Videos, Store, Press)
- Homepage rebuild (8-section editorial layout)
- Music page (hero, streaming links, discography)
- Story page (editorial timeline/grid with filters)
- Store page (premium editorial commerce)
- Press page (bios, press kit, images)
- Studio footer section
- Mobile-first responsive design

---

## Design System Overhaul

**Color palette** — shifting from warm coffee tones to a cinematic dark artist palette:
- Base: near-black (`hsl(0 0% 6%)`) / deep charcoal
- Text: warm ivory (`hsl(40 30% 95%)`)
- Accent: muted gold for CTAs and highlights
- Muted metallic neutrals for secondary elements
- No high-saturation colors

**Typography**:
- Display: Keep Playfair Display for headlines (elegant, editorial)
- Body: Keep DM Sans (clean, modern)
- Increase scale contrast — hero headlines much larger, generous letter-spacing on uppercase labels

**Layout principles**:
- Full-bleed hero sections with cinematic media
- Low density, generous whitespace
- Editorial rhythm — varying section heights and card sizes
- No generic rounded cards or SaaS-style components

---

## File Architecture

```text
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx          (redesigned: dark, minimal, new nav items)
│   │   ├── Footer.tsx          (new: studio section + footer links)
│   │   └── PageLayout.tsx      (new: shared page wrapper)
│   ├── home/
│   │   ├── HeroSection.tsx     (cinematic full-bleed hero)
│   │   ├── CurrentEra.tsx      (latest release spotlight)
│   │   ├── FeaturedMusic.tsx   (2-4 tracks with streaming links)
│   │   ├── StoryPreview.tsx    (editorial strip of story cards)
│   │   ├── FeaturedVideo.tsx   (single major video embed)
│   │   ├── StorePreview.tsx    (max 3 premium product cards)
│   │   └── PressPreview.tsx    (short bio + CTA)
│   ├── music/
│   │   ├── MusicHero.tsx
│   │   ├── StreamingLinks.tsx
│   │   ├── ReleaseCard.tsx
│   │   └── DiscographyTabs.tsx
│   ├── story/
│   │   ├── StoryHero.tsx
│   │   ├── StoryFilterBar.tsx
│   │   └── StoryCard.tsx
│   ├── store/
│   │   ├── StoreHero.tsx
│   │   └── StoreProductCard.tsx  (premium version of ProductCard)
│   ├── press/
│   │   └── PressSection.tsx
│   ├── CartDrawer.tsx          (keep, restyle to match new design)
│   └── ProductCard.tsx         (restyle)
├── pages/
│   ├── Index.tsx               (rebuilt: 8-section editorial homepage)
│   ├── Music.tsx               (new)
│   ├── Story.tsx               (new)
│   ├── Videos.tsx              (placeholder for Phase 2)
│   ├── Store.tsx               (new: premium store page)
│   ├── Press.tsx               (new)
│   ├── ProductDetail.tsx       (restyle)
│   └── NotFound.tsx
├── data/
│   └── content.ts              (static content: bios, releases, story entries — replaced by Supabase in Phase 2)
```

---

## Page-by-Page Plan

### Homepage (Index.tsx)
8 sections, editorial pacing, no stacked-card monotony:

1. **Hero** — Full-viewport dark background, large "Cola B" lockup, positioning line, two CTAs ("Listen Now" / "Enter Her World"). Gradient overlay on background image/video placeholder.
2. **Current Era** — Cover art, release title, synopsis, streaming icons. Asymmetric layout.
3. **Featured Music** — 2-4 tracks with album art thumbnails and play/stream links. Horizontal on desktop, stacked on mobile.
4. **Story Preview** — Editorial horizontal scroll strip (desktop) / stacked cards (mobile) showing 3-4 curated moments.
5. **Featured Video** — Single large video embed/thumbnail with play overlay.
6. **Store Preview** — Max 3 products, large imagery, editorial framing. Links to /store.
7. **Press Preview** — Short artist description paragraph + "View Press Kit" CTA.
8. **Studio Footer** — Subtle "Shiba Inu Media" mention, then standard footer links.

### Music Page
- Hero with latest release art
- "Listen Everywhere" streaming platform icons
- Latest release spotlight block
- Featured releases grid (2-3 columns)
- Discography tabs: Singles | EPs/Albums | Covers | Collaborations
- Each release card: cover art, title, year, stream links

### Story Page
- Hero with editorial headline
- Filter bar: All | Music | Travel | Fashion | Events | Studio | Lifestyle | Humor
- Masonry/editorial grid of story cards (image-dominant)
- Cards vary in size for editorial rhythm

### Store Page
- Featured collection hero banner
- Premium product grid (2-3 columns, large images, generous spacing)
- Products pulled from Shopify (existing integration preserved)
- Editorial framing — products feel like part of the brand world

### Press Page
- Static content: 50-word bio, 150-word bio, longer bio
- High-res image gallery (placeholder images initially)
- Press kit download CTA
- Latest release note
- Contact/inquiries section

### Videos Page (Phase 1 placeholder)
- Simple page with "Coming Soon" or a single featured video embed
- Full build in Phase 2

---

## Data Layer (Phase 1)

For Phase 1, content lives in a static `src/data/content.ts` file containing:
- Release objects (title, cover image URL, streaming links, synopsis)
- Story entries (title, date, category, image, caption)
- Bio text (short, medium, long)
- Brand constants

This keeps Phase 1 focused on the frontend experience. Phase 2 will migrate this to Supabase with the full content model and AI campaign engine from the spec.

---

## Shopify Integration

The existing Shopify integration (Storefront API, cart store, checkout flow) is preserved unchanged. The Store page and homepage store preview will use the same `fetchProducts` and cart system, just with restyled components.

---

## Key Technical Decisions

- **No Supabase in Phase 1** — static content file keeps scope manageable; the full CMS/campaign engine comes in Phase 2
- **No AI generation in Phase 1** — copy is hand-authored in the content file; Gemini integration comes in Phase 2
- **React Router** — add routes for /music, /story, /videos, /store, /press
- **Existing dependencies** are sufficient — no new packages needed beyond what's installed
- **Dark mode only** — the site's identity is the dark premium aesthetic; remove light mode toggle concern

---

## Implementation Order

1. Design system overhaul (index.css, tailwind.config.ts) — dark palette, spacing, typography scale
2. Static content data file
3. Layout components (Navbar, Footer, PageLayout)
4. Homepage sections (all 8)
5. Music page
6. Story page
7. Store page (restyle existing product integration)
8. Press page
9. Product detail page restyle
10. Cart drawer restyle
11. Mobile responsive pass across all pages
12. Routes wiring in App.tsx

