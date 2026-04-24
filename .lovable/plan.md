

## Add private A&R page: `/lovevibevol5`

Standalone, password-gated page for LoveVibe Vol. 5. Fully isolated — no navbar, no footer, no indexing.

### Files to create

**1. `public/lovevibe-cover.jpg`** — copy the uploaded cover art (`user-uploads://離.jpg`) to public root so it serves at `/lovevibe-cover.jpg`.

**2. `src/pages/LoveVibeVol5.tsx`** — the component exactly as provided, plus a `useEffect` that:
- Sets `document.title = "離 — LoveVibe Vol. 5 (Private)"`
- Injects `<meta name="robots" content="noindex, nofollow">` on mount, removes on unmount

### Files to edit

**3. `src/App.tsx`** — add route:
```tsx
<Route path="/lovevibevol5" element={<LoveVibeVol5 />} />
```
Rendered directly — no `PageLayout`, `Navbar`, or `Footer`.

**4. `public/robots.txt`** — add `Disallow: /lovevibevol5` for all user-agents.

### Notes

- Password `chloethecat` is client-side (visible in JS bundle) — gated, not secure. Acceptable for A&R preview.
- SoundCloud iframe URL preserved verbatim including `secret_token`.
- Inline styles only — page renders independently of site theme.
- Dynamic sitemap edge function only emits known DB-driven URLs, so this route is already excluded.

