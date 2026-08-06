/**
 * Centralized analytics module wrapping Facebook Pixel and Google Analytics 4.
 *
 * Analytics scripts are NOT loaded until `initAnalytics()` is called — typically
 * after the visitor accepts the cookie consent banner. This guarantees zero
 * third-party requests for visitors who reject or have not yet decided.
 *
 * GA4 Measurement ID is read from `import.meta.env.VITE_GA_MEASUREMENT_ID`.
 * If it is not set, GA4 init is skipped silently; FB Pixel still initializes.
 */

/* ---------- type shims ---------- */
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    _fbq?: unknown;
  }
}

const CONSENT_KEY = "cola_consent_v1";
const FB_PIXEL_ID = "727072914651931";

let initialized = false;

/* ---------- consent helpers ---------- */
export function getConsent(): "accepted" | "rejected" | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(CONSENT_KEY);
  return v === "accepted" || v === "rejected" ? v : null;
}

export function setConsent(value: "accepted" | "rejected") {
  localStorage.setItem(CONSENT_KEY, value);
}

export function hasConsent(): boolean {
  return getConsent() === "accepted";
}

/* ---------- script injection ---------- */
function injectGA4(measurementId: string) {
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  } as typeof window.gtag;
  window.gtag!("js", new Date());
  window.gtag!("config", measurementId);
}

function injectFBPixel() {
  /* eslint-disable */
  // @ts-ignore
  !function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  window.fbq?.("init", FB_PIXEL_ID);
  window.fbq?.("track", "PageView");
}

/**
 * Initialize analytics providers. Safe to call multiple times — guarded.
 * Call this only after the visitor has granted consent.
 */
export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
  if (gaId && gaId.trim().length > 0) {
    injectGA4(gaId.trim());
  }
  injectFBPixel();
}

/* ---------- helpers (no-op until init) ---------- */
const fbq = (...args: unknown[]) => window.fbq?.(...args);
const gtag = (...args: unknown[]) => window.gtag?.(...args);

/* ---------- Page view ---------- */
export function trackPageView(path: string) {
  fbq("track", "PageView");
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

/* ---------- Streaming click ---------- */
export function trackReleaseClick(params: { release_id: string; platform: string; title?: string }) {
  gtag("event", "release_click", {
    release_id: params.release_id,
    platform: params.platform,
    release_title: params.title,
  });
}

/* ---------- Social click ---------- */
export function trackSocialClick(platform: string, location?: string) {
  gtag("event", "social_click", { platform, location });
}

/* ---------- Share click ---------- */
export function trackShareClick(platform: string, contentType: string, contentId: string) {
  gtag("event", "share", {
    method: platform,
    content_type: contentType,
    item_id: contentId,
  });
}

/* ---------- Newsletter signup ---------- */
export function trackNewsletterSignup(source: string) {
  fbq("track", "Lead", { source });
  gtag("event", "newsletter_signup", { source });
}


/* ---------- Generic editorial engagement events ---------- */
/**
 * Consent-aware by construction: gtag/fbq are only defined after init(),
 * which runs once the visitor accepts analytics cookies.
 */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  gtag("event", name, params);
}

export const trackHeroListen = (location = "home_hero") => trackEvent("hero_listen", { location });
export const trackVideoPlay = (videoId: string, title: string, location: string) =>
  trackEvent("video_play", { video_id: videoId, video_title: title, location });
export const trackStoryOpen = (storyId: string, location: string) =>
  trackEvent("story_open", { story_id: storyId, location });
export const trackStoreVisit = (location: string) => trackEvent("store_visit", { location });
export const trackChatOpen = (location: string) => trackEvent("chat_open", { location });
export const trackLanguageChange = (language: string) => trackEvent("language_change", { language });
