

## Hero Section Redesign — Immersive Musical Aesthetic

This is a major visual overhaul of the HeroSection and CurrentEra components to match the concept image. The design merges the hero and latest releases into one cohesive, full-viewport experience.

---

### Dependencies

- Install **framer-motion** for orbit animations, floating effects, and smooth transitions.

---

### 1. New HeroSection Component (`src/components/home/HeroSection.tsx`)

Complete rewrite with these layers:

**Background:**
- Gradient from warm peach (left) to deep purple/blue (right)
- SVG musical overlays: floating notes, treble clef, staves — all semi-transparent white at ~10-15% opacity
- Horizontal audio waveform bars spanning mid-section at low opacity

**Glassmorphic Floating Player (top-left):**
- `backdrop-blur-md bg-white/10 border border-white/20` card
- Contains: small artist thumbnail, stylized waveform graphic, mini tracklist (3 lines)
- Framer Motion `animate={{ y: [0, -8, 0] }}` with `repeat: Infinity` for gentle float
- Close button (cosmetic)

**Typography & Buttons:**
- "COLA B" in existing `text-hero` size, bold, dark
- Subtitle and tagline unchanged
- Buttons get glassmorphic treatment: `bg-white/15 backdrop-blur-sm border border-white/30`
- Hover: `shadow-[0_0_20px_rgba(180,100,255,0.4)]` glow + `scale(1.05)` via Framer Motion

**Avatar & Orbit Effects (right side):**
- Existing hero image stays
- 2 orbiting elliptical rings (cyan + magenta) using Framer Motion `rotate` animation on styled divs with `border` and `border-radius: 50%` at different rotations
- 1-2 vinyl record SVGs with `animate-spin` (slow, 20s) + floating keyframe

**Latest Releases Bottom Bar:**
- Dark purple/charcoal bar at bottom (`bg-[hsl(260,20%,12%)]`)
- Faint equalizer pattern background via SVG
- 4-5 album cover cards fetched from `fetchReleases()` — pulled up with negative margin to overlap into hero
- Each card: rounded corners, glowing magenta drop-shadow, hover lift effect
- Title + type label below each

---

### 2. Tailwind Config Updates (`tailwind.config.ts`)

Add keyframes:
- `float`: gentle up-down bob
- `spin-slow`: 20s linear infinite rotation
- `orbit`: 360deg rotation for light trails

Add animations:
- `animate-float`, `animate-spin-slow`, `animate-orbit`

---

### 3. CSS Updates (`src/index.css`)

Add `@keyframes float` and vinyl/orbit-related keyframes if not using Framer Motion for all.

---

### 4. Index Page (`src/pages/Index.tsx`)

The CurrentEra component below the hero will remain but the hero now includes the "Latest Releases" bottom bar, creating a seamless full-viewport experience. No structural changes to Index needed — just the HeroSection itself becomes taller and more immersive.

---

### File Changes Summary

| File | Action |
|------|--------|
| `package.json` | Add `framer-motion` |
| `src/components/home/HeroSection.tsx` | Full rewrite |
| `tailwind.config.ts` | Add float/spin-slow/orbit keyframes |
| `src/index.css` | Minor keyframe additions |

