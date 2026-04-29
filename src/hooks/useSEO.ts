import { useEffect } from "react";

const SITE_NAME = "Cola B";
const SITE_URL = "https://colabbmusic.com";
const BRAND_SUFFIX = "Cola B — Queen of Emo Pop";
const DEFAULT_TITLE = "Cola B — Queen of Emo Pop | Official Site";
const DEFAULT_DESCRIPTION = "The official home of Cola B — latest music, videos, story, and exclusive merchandise.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;

type JsonLdGraph = Record<string, unknown>;

interface SEOOptions {
  title?: string;
  description?: string;
  image?: string | null;
  url?: string;
  type?: string;
  jsonLd?: JsonLdGraph | JsonLdGraph[];
  publishedTime?: string;
  author?: string;
  section?: string;
  keywords?: string[];
  noindex?: boolean;
  /**
   * If true, use `title` exactly as provided. Otherwise, the hook formats it as
   * `{title} | Cola B — Queen of Emo Pop` (unless the title already contains "Cola B").
   */
  exactTitle?: boolean;
}

function formatTitle(raw: string | undefined, exact: boolean | undefined): string {
  if (!raw) return DEFAULT_TITLE;
  if (exact) return raw;
  if (raw.includes("Cola B")) return raw;
  return `${raw} | ${BRAND_SUFFIX}`;
}

function setMeta(attr: "property" | "name", key: string, content: string): () => void {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  const existed = !!el;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  const prev = el.getAttribute("content");
  el.setAttribute("content", content);
  return () => {
    if (!existed) el!.remove();
    else if (prev) el!.setAttribute("content", prev);
  };
}

function setCanonical(href: string): () => void {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  const prev = el.getAttribute("href");
  el.setAttribute("href", href);
  return () => {
    if (!prev) el!.remove();
    else el!.setAttribute("href", prev);
  };
}

function setHreflang(lang: string, href: string): () => void {
  const el = document.createElement("link");
  el.setAttribute("rel", "alternate");
  el.setAttribute("hreflang", lang);
  el.setAttribute("href", href);
  document.head.appendChild(el);
  return () => el.remove();
}

function setJsonLd(data: JsonLdGraph): () => void {
  const el = document.createElement("script");
  el.setAttribute("type", "application/ld+json");
  el.textContent = JSON.stringify(data);
  document.head.appendChild(el);
  return () => el.remove();
}

export function useSEO({
  title,
  description,
  image,
  url,
  type = "website",
  jsonLd,
  publishedTime,
  author,
  section,
  keywords,
  noindex,
  exactTitle,
}: SEOOptions = {}) {
  useEffect(() => {
    const fullTitle = formatTitle(title, exactTitle);
    const desc = description || DEFAULT_DESCRIPTION;
    const img = image || DEFAULT_IMAGE;
    const path = window.location.pathname;
    const canonical = url || `${SITE_URL}${path}`;

    document.title = fullTitle;

    const cleanups = [
      setMeta("property", "og:title", fullTitle),
      setMeta("property", "og:description", desc),
      setMeta("property", "og:image", img),
      setMeta("property", "og:url", canonical),
      setMeta("property", "og:type", type),
      setMeta("name", "twitter:title", fullTitle),
      setMeta("name", "twitter:description", desc),
      setMeta("name", "twitter:image", img),
      setMeta("name", "description", desc),
      setCanonical(canonical),
      setHreflang("en", `${SITE_URL}${path}?lang=en`),
      setHreflang("zh-HK", `${SITE_URL}${path}?lang=zh-HK`),
      setHreflang("x-default", `${SITE_URL}${path}`),
    ];

    if (noindex) {
      cleanups.push(setMeta("name", "robots", "noindex,nofollow"));
    }

    if (type === "article") {
      if (publishedTime) cleanups.push(setMeta("property", "article:published_time", publishedTime));
      if (author) cleanups.push(setMeta("property", "article:author", author));
      if (section) cleanups.push(setMeta("property", "article:section", section));
      if (keywords?.length) cleanups.push(setMeta("property", "article:tag", keywords.join(", ")));
    }
    if (keywords?.length) cleanups.push(setMeta("name", "keywords", keywords.join(", ")));

    if (jsonLd) {
      const graphs = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      graphs.forEach((g) => cleanups.push(setJsonLd(g)));
    }

    return () => {
      document.title = DEFAULT_TITLE;
      cleanups.forEach((fn) => fn());
    };
  }, [title, description, image, url, type, jsonLd, publishedTime, author, section, keywords, noindex, exactTitle]);
}

export { SITE_NAME, SITE_URL, BRAND_SUFFIX };
