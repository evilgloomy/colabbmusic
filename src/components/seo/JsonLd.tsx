import { useEffect } from "react";

type Graph = Record<string, unknown>;

/**
 * Imperative JSON-LD injector. Mounts a <script type="application/ld+json">
 * for each graph and removes them on unmount.
 *
 * Most pages use the `jsonLd` option on `useSEO` instead, which already
 * delegates here. Use this component directly when you need to inject
 * structured data outside of the SEO hook lifecycle.
 */
export const JsonLd = ({ data }: { data: Graph | Graph[] }) => {
  useEffect(() => {
    const graphs = Array.isArray(data) ? data : [data];
    const nodes = graphs.map((g) => {
      const el = document.createElement("script");
      el.type = "application/ld+json";
      el.textContent = JSON.stringify(g);
      document.head.appendChild(el);
      return el;
    });
    return () => nodes.forEach((n) => n.remove());
  }, [data]);

  return null;
};

/**
 * Build a schema.org BreadcrumbList graph.
 * Pass the trail in order, e.g.:
 *   buildBreadcrumb([{ name: "Home", url: "/" }, { name: "Music", url: "/music" }])
 */
export function buildBreadcrumb(
  items: Array<{ name: string; url: string }>,
  siteUrl: string,
): Graph {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${siteUrl}${item.url}`,
    })),
  };
}
