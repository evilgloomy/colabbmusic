

## Plan: Integrate Shopify Store Directly Into the Site

### Current State
- `src/lib/shopify.ts` already has full Storefront API setup with cart mutations
- Navbar links Store externally to `colabbshop.com`
- `StorePreview` is a placeholder with "Shop Now" linking externally
- 47 products in Shopify, including 4 coffee products to exclude

### Product Collections (from Shopify catalog)

| Collection | Filter Query | Products |
|---|---|---|
| **Aurora by Cola B** | Title/name contains "Aurora by Cola B" but NOT "Chloe" | Signature Hoodies (4 colors), Cherry Cola Tee, Husky Tee, Cat Duo Tee, Shiba Inu Tee, Tote Bags, Beach Towel, Three Kingdoms Polo, 2026 Calendar |
| **Chloe the Cat** | Title contains "Chloe the Cat" | Tumbler, Mug, Hoodie, Phone Case, Socks, Notebook, Tote, Crewneck, Tee, Tank Top, Air Freshener, Magnet, Lunch Bag, Bath Mat, Mouse Pad |
| **Lovevibe Collection** | Title contains "Lovevibe" | #SheKnowsHeKnows Tee, #SometimesLoveJustHappens Tee |
| **Threads Meme Collection** | Title contains "Meme Collection" | 打敗99.9% tees (3), 壞過凱婷 tees (2), 關愛坐馬騮王 |
| **Digital Albums** | Type = "Digital Download" | Lovevibe, POPVIBE, 沉 |
| **Excluded** | Type = "Food & Beverages" | 4 coffee products |

### Files to Create/Modify

1. **`src/stores/cartStore.ts`** — Zustand persistent cart store with full Shopify cart sync (create, add, update, remove lines). Uses `persist` middleware with localStorage.

2. **`src/hooks/useCartSync.ts`** — Hook that syncs cart on page load and visibility change (clears completed orders).

3. **`src/pages/Store.tsx`** — Main store page with:
   - Collection tabs/filters (Aurora, Chloe the Cat, Lovevibe, Threads Meme, Digital Albums, All)
   - Product grid fetched via `fetchProducts()` from Storefront API
   - Client-side filtering by collection using title matching
   - Excludes coffee products (Food & Beverages type)
   - Matches the site's "digital luxe" aesthetic — geometric cards, uppercase labels, Sora font

4. **`src/pages/ProductDetail.tsx`** — Individual product page at `/product/:handle`:
   - Fetches product via `fetchProductByHandle(handle)`
   - Image gallery with thumbnail navigation
   - Variant/option selector (size, color)
   - "Add to Cart" button wired to cart store
   - Price display, description

5. **`src/components/store/ProductCard.tsx`** — Reusable product card:
   - Product image, title, price
   - Clickable → navigates to `/product/:handle`
   - "Add to Cart" quick-add button

6. **`src/components/store/CartDrawer.tsx`** — Sheet/drawer for cart:
   - Cart icon in navbar with badge count
   - Line items with quantity +/- controls
   - Remove item button
   - Total price
   - "Checkout with Shopify" button → `window.open(checkoutUrl, '_blank')`

7. **`src/components/home/StorePreview.tsx`** — Update to show 4 featured products from Shopify API instead of placeholder

8. **`src/components/layout/Navbar.tsx`** — Change Store link from external to internal `/store` route, add CartDrawer component

9. **`src/App.tsx`** — Add `/store` and `/product/:handle` routes, add `useCartSync` hook

### Technical Details

- Products fetched with `useQuery` from `@tanstack/react-query` for caching
- Collection filtering done client-side by matching product title against collection keywords, excluding any product with type "Food & Beverages"
- Cart state persisted via Zustand `persist` middleware to localStorage
- Checkout URL always includes `channel=online_store` param and opens in new tab
- All styling follows existing "digital luxe" conventions: glassmorphism, uppercase tracking, champagne/lavender accents

