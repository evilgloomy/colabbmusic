

## Cola B Official Website Rebuild — Phase 1 Plan

### What exists today
- Working automation: discography sync from YouTube, story sync from Threads, streaming links from HyperFollow, story media caching
- Working pages: Home, Music, Story, Videos, Store (Shopify), Press, Chat, Release detail
- Bilingual i18n (EN / zh-HK)
- SEO system with JSON-LD

### What needs to change
The site currently looks like assembled modules with a pastel-lavender "digital luxe" aesthetic. The spec demands a **premium editorial artist headquarters** with a warm porcelain/blush/charcoal palette and stronger visual hierarchy.

### Phased approach
This rebuild is too large for a single pass. Here is a **Priority 1** plan covering the most impactful changes. We will follow up with Priority 2 and 3 after this lands.

---

### Priority 1: Visual Foundation + Homepage Art Direction

**1. Color system overhaul (`src/index.css` + `tailwind.config.ts`)**

Replace the current lavender/champagne/cyan palette with the spec's direction:
- `--background`: warm off-white / porcelain (e.g. `30 20% 97%`)
- `--foreground`: deep charcoal (e.g. `20 10% 12%`)
- `--card`: pale blush beige (e.g. `25 15% 95%`)
- `--primary`: dusty rose (e.g. `350 25% 65%`)
- `--muted-foreground`: cocoa brown (e.g. `20 10% 45%`)
- `--accent`: muted blush pink (e.g. `340 20% 80%`)
- Remove cyan-glow, lavender, deep-rose custom vars
- Add `--rose-dust`, `--porcelain`, `--cocoa`, `--soft-silver`

**2. Typography system (`src/index.css` + `tailwind.config.ts`)**

- Add a display typeface for hero/headlines: **Playfair Display** (elegant serif) via Google Fonts
- Keep **Sora** as the body/UI sans-serif
- Update `font-display` to use Playfair Display
- Tighten type scale: reduce `text-hero` max, adjust letter-spacing
- Reduce decorative weight usage

**3. Homepage rebuild (`src/pages/Index.tsx` + home components)**

Restore the full homepage section order from the spec:
1. Hero → 2. Current Era → 3. Featured Music → 4. Story Preview → 5. Featured Video → 6. Store Preview → 7. Press Preview → 8. Studio Footer

The current Index only renders Hero + CurrentEra + StoryPreview. Add back FeaturedMusic, FeaturedVideo, StorePreview, PressPreview.

**4. Hero section redesign (`src/components/home/HeroSection.tsx`)**

- Remove particle shimmer, glowing lines, and decorative SVG stars
- Asymmetric layout: Cola B portrait on one side, minimal text on the other
- Short copy: "COLA B" + "Queen of Emo Pop" tagline (from approved copy)
- Two CTAs: "Listen Now" → /music, "Explore Story" → /story
- Warm gradient background (porcelain → pale blush → soft rose)
- Much more negative space
- No clutter above the fold

**5. Current Era section refinement (`src/components/home/CurrentEra.tsx`)**

- Remove particle effects and waveform decorations
- Enlarge cover art presence, make title dominant
- Simplify streaming link pills
- Keep the carousel of latest releases but cleaner styling
- Dark background stays but uses charcoal instead of purple

**6. Navbar refinement (`src/components/layout/Navbar.tsx`)**

- Add "Cola B" wordmark/logo on the left (currently missing — nav only has links)
- Keep clean slash-separated nav links
- Warm off-white glass background instead of current cool tone

**7. Update brand copy (`src/hooks/useBrand.ts` + `src/i18n/en.json` + `src/i18n/zh-HK.json`)**

Replace current generic brand copy with the approved A&R copy from the spec:
- Short bio, medium bio, full bio (EN + zh-HK)
- Tagline: "Queen of Emo Pop"
- Hero body text from Section 24.2/24.9
- Update all i18n keys that reference brand positioning

**8. Remove glassmorphism utilities (`src/index.css`)**

- Remove `.glass`, `.glass-strong`, `.glass-dark` utility classes
- Replace with simpler translucent backgrounds using the new palette
- Remove `shimmer-bg`, `float-particle` keyframes
- Clean up gradient utilities to match new palette

**9. Add About Cola B page route (`src/App.tsx` + new page)**

- Create `/about-cola` route serving the approved A&R artist profile copy
- Include: hero, positioning, full biography, artist development timeline, CTA blocks
- Support both EN and zh-HK from the i18n system
- Update footer "About Cola B" link to point to `/about-cola` instead of `/story`

---

### What stays the same
- All backend automation (sync-releases, sync-threads-posts, cache-album-art, scrape-hyperfollow)
- Database schema and tables
- Shopify integration and store logic
- i18n framework (just updating copy values)
- SEO hook system
- Chat page

### Files to create/edit

| File | Action |
|------|--------|
| `src/index.css` | Rewrite CSS variables, remove glassmorphism |
| `tailwind.config.ts` | Update fonts, colors, remove old custom colors |
| `src/pages/Index.tsx` | Add all homepage sections back |
| `src/components/home/HeroSection.tsx` | Full redesign |
| `src/components/home/CurrentEra.tsx` | Remove decorations, refine |
| `src/components/home/FeaturedMusic.tsx` | Minor styling updates |
| `src/components/home/FeaturedVideo.tsx` | Minor styling updates |
| `src/components/home/StorePreview.tsx` | Minor styling updates |
| `src/components/home/PressPreview.tsx` | Update copy |
| `src/components/layout/Navbar.tsx` | Add wordmark, warm palette |
| `src/components/layout/Footer.tsx` | Palette update |
| `src/hooks/useBrand.ts` | Replace with approved A&R copy |
| `src/i18n/en.json` | Update brand copy, add about keys |
| `src/i18n/zh-HK.json` | Update brand copy, add about keys |
| `src/pages/AboutCola.tsx` | New page — artist profile + timeline |
| `src/App.tsx` | Add `/about-cola` route |

### After Priority 1
Priority 2 will cover: Story page editorial redesign, Store visual upgrade, mobile hierarchy correction, inner page hero banners update. Priority 3: Era/campaign system, section-specific polish, press/studio cleanup.

