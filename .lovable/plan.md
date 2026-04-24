

## Update `/lovevibevol5` with new interactive component

The route already exists. Replace the page contents with the new component (clickable tracklist + per-track SoundCloud players + expanded series story) and swap in the new cover art.

### Files to edit

**1. `src/pages/LoveVibeVol5.tsx`** — replace entirely with the provided component. Key changes vs current:
- Per-track SoundCloud URLs with click-to-play active track state
- "Now playing" indicator + auto-play iframe keyed on active track
- Expanded series section with full Cantonese story per volume + intro paragraph
- Track 02 subtitle updated to "Shivering Version"
- Track 05 renamed to "Agony 愛過你"
- Inline `<style>` block instead of inline style objects
- TypeScript: add `: string` annotation to `embedUrl(url)` parameter (component code is JS; project is TS)
- Preserve existing `useEffect` that sets `document.title` and injects `<meta name="robots" content="noindex, nofollow">` on mount/cleanup on unmount

**2. `public/lovevibe-cover.jpg`** — overwrite with the newly uploaded `離.jpg` so `/lovevibe-cover.jpg` serves the latest art.

### Already in place (no changes needed)

- Route `/lovevibevol5` registered in `src/App.tsx` outside `PageLayout` — page is fully isolated (no navbar/footer)
- `public/robots.txt` already has `Disallow: /lovevibevol5` for all crawlers
- Sitemap edge function does not list this route

### Notes

- Password `chloethecat` remains client-side only (visible in JS bundle) — acceptable for A&R preview, not secure
- `auto_play=true` on the iframe means clicking a track immediately plays it (the `key={activeTrack}` forces iframe remount)
- Mobile responsiveness handled by `clamp()` typography and the 780px max-width container
- Component is self-contained CSS via injected `<style>` block — won't affect the rest of the site

