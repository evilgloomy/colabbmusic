## EPIC 1 — Plumbing fixes (6 tickets)

This plan implements all six tickets. Each section maps 1:1 to a ticket and lists the concrete file changes.

---

### TICKET-101 — Real GA4 Measurement ID, env-driven

**Goal:** No `G-XXXXXXXXXX` literals in repo; GA initializes from env and only when an ID is present.

Changes:
- `index.html` — remove the two GA4 `<script>` blocks (lines ~20–27). Also remove the inline FB Pixel block (moved in TICKET-104 below).
- `src/lib/analytics.ts` — add `initAnalytics(consent: boolean)` that, when called:
  - reads `import.meta.env.VITE_GA_MEASUREMENT_ID`; if defined, dynamically injects `https://www.googletagmanager.com/gtag/js?id=...`, sets up `window.dataLayer`/`gtag`, and calls `gtag('config', id)`.
  - dynamically injects the FB Pixel snippet and calls `fbq('init', '727072914651931'); fbq('track','PageView')`.
  - guards against double-init via a module-level flag.
- `src/hooks/usePageTracking.ts` — unchanged behavior; already calls `gtag('event','page_view',{ page_path })` on route change. Confirmed safe because `gtag` calls are no-ops until init.
- `.env` is auto-managed by Lovable Cloud; user must add `VITE_GA_MEASUREMENT_ID` via Project Settings (we will surface this in chat with `add_secret` flow). We will NOT edit `.env` directly. We'll add a short note to `README.md`.

Acceptance: grep for `G-XXXXXXXXXX` returns zero. With consent + valid ID, GA4 DebugView fires `page_view` on each route.

---

### TICKET-102 — Canonical domain + redirects + sitemap

**Goal:** `https://colabbmusic.com` is canonical everywhere.

Changes:
- `index.html` — update `<link rel="canonical">`, `og:url`, all reference URLs to `https://colabbmusic.com/`.
- `src/hooks/useSEO.ts` — change `SITE_URL` constant to `https://colabbmusic.com`.
- `public/sitemap.xml` — rewrite all `<loc>` entries to use `https://colabbmusic.com/...`.

Note on the 301 redirect from `colabbmusic.lovable.app` → `colabbmusic.com`: this is configured in Lovable's Project Settings → Domains (set `colabbmusic.com` as **Primary**; the `*.lovable.app` host then auto-redirects). I'll surface this as a manual step in the final summary — it cannot be done in code.

Acceptance: every canonical/OG URL points to colabbmusic.com; sitemap matches.

---

### TICKET-103 — Real OG share card

**Goal:** Branded 1200×630 share card site-wide, overridable per page.

Changes:
- Add `public/og-image.jpg` — placeholder generated 1200×630 image (artist photo + "COLA B" wordmark + tagline) so the path resolves immediately. Designer can swap the JPG later without code changes.
- `index.html` — `og:image` and `twitter:image` → `https://colabbmusic.com/og-image.jpg`.
- `src/hooks/useSEO.ts` — already accepts `image?: string | null`; update `DEFAULT_IMAGE` to the new URL. (No API change required — pages already pass `image`.)

Acceptance: opengraph.xyz shows a branded card for `/` and a release-specific card for `/release/:id`.

---

### TICKET-104 — Cookie consent + Privacy + Terms

**Goal:** Zero analytics network calls before the visitor accepts.

Changes:
- `src/lib/analytics.ts` — add `initAnalytics()` (see TICKET-101) and `hasConsent()` helper reading `localStorage.cola_consent_v1`.
- `src/components/layout/CookieConsent.tsx` (new) — fixed-bottom banner using shadcn Button + Card. Reads/writes `cola_consent_v1` (`accepted | rejected`). On accept → `initAnalytics()`. On reject → no-op. Hidden once a value is set.
- `src/components/layout/PageLayout.tsx` — mount `<CookieConsent />` at the bottom; on mount, if `cola_consent_v1 === 'accepted'`, call `initAnalytics()` for returning visitors.
- `src/pages/Privacy.tsx`, `src/pages/Terms.tsx` (new) — full pages wrapped in `PageLayout`, using `useSEO`. Initial copy will be a clearly-labeled placeholder ("Draft — replace with lawyer-reviewed copy") covering: data collected (analytics cookies, pixel), purpose, third parties (Google, Meta, Shopify, Supabase), user rights, contact email. PR description will note legal review TODO.
- `src/App.tsx` — add routes `/privacy` and `/terms`.
- `src/components/layout/Footer.tsx` lines 48–51 — replace `<span>` for "Privacy Policy" / "Terms of Service" with `<Link to="/privacy">` / `<Link to="/terms">`.
- `index.html` — confirm GA + FB Pixel scripts removed (done in 101).
- `src/i18n/en.json` and `src/i18n/zh-HK.json` — add `consent.message`, `consent.accept`, `consent.reject`, `consent.learnMore` keys.

Acceptance: fresh visitor with cleared storage sees banner; DevTools Network shows zero `googletagmanager.com` / `connect.facebook.net` requests until "Accept" is clicked.

---

### TICKET-105 — i18n correctness (`<html lang>`, alt text, hreflang)

**Goal:** Document language reflects active locale; alt text translatable; hreflang present.

URL strategy decision: **query param `?lang=zh-HK`** (simplest; no router refactor; matches react-i18next localStorage detection). The hook already persists choice; query param is purely an SEO signal.

Changes:
- `src/hooks/useHtmlLang.ts` (new) — `useEffect` that sets `document.documentElement.lang = i18n.language` and re-runs on `languageChanged`.
- `src/components/layout/PageLayout.tsx` — call `useHtmlLang()`.
- `src/components/home/HeroSection.tsx` line 23 — replace hardcoded alt with `t("hero.portraitAlt")`. Add the key to both i18n JSON files. Sweep other `alt="..."` literals (Footer logo, any home components) and convert to i18n keys.
- `src/hooks/useSEO.ts` — emit `<link rel="alternate" hreflang="en" href="<canonical>?lang=en">` and `hreflang="zh-HK"` for every page, plus `hreflang="x-default"`. Implement with the same cleanup pattern as existing meta helpers.

Acceptance: View source with Chinese active → `<html lang="zh-HK">`. Hreflang triplet present on every page.

---

### TICKET-106 — `noindex` on `/lovevibevol5`

Changes:
- `src/hooks/useSEO.ts` — add optional `noindex?: boolean`. When true, set `<meta name="robots" content="noindex,nofollow">` (with cleanup like other tags).
- `src/pages/LoveVibeVol5.tsx` — add `useSEO({ title: "LOVEVIBE Vol. 5 — Preview", noindex: true })` near the top of the component.

Acceptance: `view-source:/lovevibevol5` shows the robots meta tag.

---

### Out-of-band manual steps (called out in final summary, not code)

1. Add `VITE_GA_MEASUREMENT_ID` in Project Settings → Environment (Lovable manages `.env`).
2. In Project Settings → Domains, set `colabbmusic.com` as **Primary** so `*.lovable.app` 301-redirects.
3. Replace `public/og-image.jpg` placeholder with the designer's final 1200×630 artwork.
4. Have lawyer review `/privacy` and `/terms` copy before launch.

---

### Technical notes

- All new meta/link injections follow the existing `setMeta`/`setCanonical` cleanup pattern in `useSEO.ts` to avoid duplicates on route change.
- `initAnalytics()` injects scripts dynamically rather than relying on inline `<script>` tags so consent gating actually works.
- `usePageTracking` stays as-is — `gtag`/`fbq` shims in `analytics.ts` already no-op when the globals don't exist.
- No backend / Supabase changes required.
