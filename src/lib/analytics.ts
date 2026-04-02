/**
 * Centralized analytics module wrapping Facebook Pixel and Google Analytics 4.
 *
 * GA4 Measurement ID is read from the global `window.__GA4_ID` or falls back
 * to the value embedded in index.html.  If GA4 is not loaded the FB-only
 * calls still fire safely.
 */

/* ---------- type shims ---------- */
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

/* ---------- helpers ---------- */
const fbq = (...args: unknown[]) => window.fbq?.(...args);
const gtag = (...args: unknown[]) => window.gtag?.(...args);

/* ---------- Page view ---------- */
export function trackPageView(path: string) {
  // Facebook Pixel
  fbq("track", "PageView");

  // GA4
  gtag("event", "page_view", { page_path: path });
}

/* ---------- View Content (product detail) ---------- */
export function trackViewContent(product: {
  id: string;
  title: string;
  price: string;
  currency: string;
  category?: string;
}) {
  fbq("track", "ViewContent", {
    content_ids: [product.id],
    content_name: product.title,
    content_type: "product",
    value: parseFloat(product.price),
    currency: product.currency,
  });

  gtag("event", "view_item", {
    currency: product.currency,
    value: parseFloat(product.price),
    items: [
      {
        item_id: product.id,
        item_name: product.title,
        price: parseFloat(product.price),
      },
    ],
  });
}

/* ---------- Add to Cart ---------- */
export function trackAddToCart(params: {
  id: string;
  title: string;
  variantTitle: string;
  price: string;
  currency: string;
  quantity: number;
}) {
  fbq("track", "AddToCart", {
    content_ids: [params.id],
    content_name: params.title,
    content_type: "product",
    value: parseFloat(params.price) * params.quantity,
    currency: params.currency,
  });

  gtag("event", "add_to_cart", {
    currency: params.currency,
    value: parseFloat(params.price) * params.quantity,
    items: [
      {
        item_id: params.id,
        item_name: params.title,
        item_variant: params.variantTitle,
        price: parseFloat(params.price),
        quantity: params.quantity,
      },
    ],
  });
}

/* ---------- Initiate Checkout ---------- */
export function trackInitiateCheckout(params: {
  items: Array<{ id: string; title: string; price: string; quantity: number }>;
  totalValue: number;
  currency: string;
}) {
  fbq("track", "InitiateCheckout", {
    content_ids: params.items.map((i) => i.id),
    num_items: params.items.reduce((s, i) => s + i.quantity, 0),
    value: params.totalValue,
    currency: params.currency,
  });

  gtag("event", "begin_checkout", {
    currency: params.currency,
    value: params.totalValue,
    items: params.items.map((i) => ({
      item_id: i.id,
      item_name: i.title,
      price: parseFloat(i.price),
      quantity: i.quantity,
    })),
  });
}
