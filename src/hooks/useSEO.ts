import { useEffect } from "react";

const SITE_NAME = "Cola B";
const SITE_URL = "https://colabbmusic.lovable.app";
const DEFAULT_TITLE = "Cola B — Official Site";
const DEFAULT_DESCRIPTION = "The official home of Cola B — latest music, videos, story, and exclusive merchandise.";
const DEFAULT_IMAGE = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cd0e128e-192a-4352-bd66-093c6cc69e97/id-preview-8d1a5971--48c39440-c9aa-442b-8c62-ac6e4310a589.lovable.app-1773112558810.png";

interface SEOOptions {
  title?: string;
  description?: string;
  image?: string | null;
  url?: string;
  type?: string;
  jsonLd?: Record<string, unknown>;
  publishedTime?: string;
  author?: string;
  section?: string;
  keywords?: string[];
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

function setJsonLd(data: Record<string, unknown>): () => void {
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
}: SEOOptions = {}) {
  useEffect(() => {
    const fullTitle = title || DEFAULT_TITLE;
    const desc = description || DEFAULT_DESCRIPTION;
    const img = image || DEFAULT_IMAGE;
    const canonical = url || `${SITE_URL}${window.location.pathname}`;

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
    ];

    if (type === "article") {
      if (publishedTime) cleanups.push(setMeta("property", "article:published_time", publishedTime));
      if (author) cleanups.push(setMeta("property", "article:author", author));
      if (section) cleanups.push(setMeta("property", "article:section", section));
      if (keywords?.length) cleanups.push(setMeta("property", "article:tag", keywords.join(", ")));
    }
    if (keywords?.length) cleanups.push(setMeta("name", "keywords", keywords.join(", ")));

    if (jsonLd) {
      cleanups.push(setJsonLd(jsonLd));
    }

    return () => {
      document.title = DEFAULT_TITLE;
      cleanups.forEach((fn) => fn());
    };
  }, [title, description, image, url, type, jsonLd, publishedTime, author, section, keywords]);
}

export { SITE_NAME, SITE_URL };
