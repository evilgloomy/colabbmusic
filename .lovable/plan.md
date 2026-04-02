

## Add Comprehensive Analytics Tracking

Add Google Analytics 4, enhanced Facebook Pixel events, and SPA page-level tracking so every route change and key user action is captured.

---

### What you'll get

- **Google Analytics 4** — full traffic, behavior, and conversion tracking via GA4
- **Facebook Pixel events** — AddToCart, ViewContent, InitiateCheckout fired on real user actions
- **SPA route tracking** — both GA4 and FB Pixel fire on every client-side page navigation, not just the initial load

---

### Technical plan

**1. Create `src/lib/analytics.ts`** — a single utility module that wraps both GA4 and FB Pixel calls:
- `trackPageView(path)` — fires GA4 `page_view` and FB `PageView`
- `trackViewContent(product)` — fires FB `ViewContent` and GA4 `view_item`
- `trackAddToCart(product, variant, quantity, price)` — fires FB `AddToCart` and GA4 `add_to_cart`
- `trackInitiateCheckout(items, total)` — fires FB `InitiateCheckout` and GA4 `begin_checkout`

**2. Update `index.html`** — add the GA4 gtag.js script in `<head>` (you'll need to provide your GA4 Measurement ID, e.g. `G-XXXXXXXXXX`)

**3. Create `src/hooks/usePageTracking.ts`** — a hook that listens to React Router location changes and calls `trackPageView` on every route change

**4. Wire the hook into `src/App.tsx`** — call `usePageTracking()` inside `AppInner` (which already has Router context)

**5. Add event tracking to key user actions:**
- `src/pages/ProductDetail.tsx` — call `trackViewContent` when product loads
- `src/stores/cartStore.ts` — call `trackAddToCart` inside `addItem`
- `src/components/store/CartDrawer.tsx` — call `trackInitiateCheckout` inside `handleCheckout`

---

### What I need from you

Before implementing, I need your **Google Analytics 4 Measurement ID** (looks like `G-XXXXXXXXXX`). You can find it in your GA4 property under Admin → Data Streams. If you don't have one yet, I can set up just the Facebook Pixel events and SPA tracking first, and add GA4 later.

