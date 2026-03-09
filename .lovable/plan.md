

# Redesign: Soft Pink / Rose Gold Luxury Theme

Based on the reference image, the site needs a complete aesthetic shift from the current dark cinematic theme to a **warm, feminine, rose-gold luxury** aesthetic with soft bokeh backgrounds, glass-like card overlays, and pink/champagne accents.

## Color System Overhaul

Replace the dark palette with:
- **Background**: Soft warm white / light champagne (`hsl(30 30% 96%)`)
- **Foreground**: Deep warm brown/charcoal for text (`hsl(350 10% 20%)`)
- **Primary**: Dusty rose / mauve pink (`hsl(340 30% 65%)`)
- **Card**: Semi-transparent frosted glass (`hsl(340 20% 95% / 0.6)`) with backdrop-blur
- **Muted**: Warm gray-pink tones
- **Accent**: Rose gold metallic (`hsl(350 35% 70%)`)
- **Border**: Soft pink/white translucent borders

Update `src/index.css` CSS variables and `tailwind.config.ts` custom colors.

## Typography Adjustments

Keep Playfair Display + DM Sans but adjust weights and sizing for the lighter palette — darker text on light backgrounds needs slightly different contrast tuning.

## Component Redesign

### Navbar (`src/components/layout/Navbar.tsx`)
- Light translucent background with frosted glass effect
- Add social media icons (Instagram, Facebook, Twitter) to the right side
- Horizontal nav with slash separators between items (matching reference)
- Hamburger menu on right

### Hero Section (`src/components/home/HeroSection.tsx`)
- Large "COLA B" display text (left-aligned, bottom portion)
- Subtitle: "Digital Singer-Songwriter." + "Living her music, life, and moments."
- Two buttons: "Listen Now" (filled pink) + "Watch Video" (outlined)
- Background: warm bokeh/sparkle gradient (placeholder image with pink/gold tones)

### Current Era / Latest Release (`src/components/home/CurrentEra.tsx`)
- Redesign as a frosted glass card with pink border
- Show "Latest Release" header with horizontal rule
- Embedded player-style layout with cover art, streaming icons
- "STREAM HERE" button

### Story + Store Preview Combined (`src/components/home/StoryPreview.tsx`)
- Rename section to "Inside Cola's World"
- Two-column layout: left card = "Life, Travel & Style" with small product images; right card = "New Video" with video thumbnail
- Below: 3 product cards with product images and names
- "Visit the Store >" CTA button

### Footer (`src/components/layout/Footer.tsx`)
- Light background matching overall theme
- Shiba Inu Media logo/name on left with studio tagline
- Footer links in a horizontal row: About Cola B | Press Kit | Contact | FAQ | Shipping & Returns
- Second row: Privacy Policy, Terms of Service, social icons
- Frosted/subtle styling

### Remove Separate Sections
- Merge FeaturedVideo into the "Inside Cola's World" section
- Merge StorePreview into the same section
- Remove PressPreview from homepage (keep press page)
- Simplify to: Hero → Latest Release → Inside Cola's World → Footer

## Files to Modify

1. **`src/index.css`** — New color variables (light pink/champagne palette)
2. **`tailwind.config.ts`** — Update custom colors, add glass/frosted utilities
3. **`src/components/layout/Navbar.tsx`** — Light glass navbar with social icons and slash separators
4. **`src/components/layout/Footer.tsx`** — Horizontal layout matching reference
5. **`src/components/home/HeroSection.tsx`** — Left-aligned text, pink buttons, warm background
6. **`src/components/home/CurrentEra.tsx`** — Frosted glass card with player-style layout
7. **`src/components/home/StoryPreview.tsx`** — "Inside Cola's World" combined section
8. **`src/pages/Index.tsx`** — Simplified section order: Hero, CurrentEra, StoryPreview (combined world section), Footer
9. **`src/components/home/StorePreview.tsx`** — May be merged into StoryPreview or restyled
10. **`src/components/home/FeaturedVideo.tsx`** — Merged into combined world section
11. **All other pages** (Music, Story, Videos, Store, Press) — Restyle to match new light palette

## Implementation Order

1. Design system (CSS variables + Tailwind config)
2. Navbar + Footer
3. Homepage sections (Hero → Latest Release → Inside Cola's World)
4. Update Index.tsx page structure
5. Restyle remaining pages (Music, Story, Videos, Store, Press, ProductDetail)
6. Cart drawer restyle

