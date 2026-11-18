import type { ShopifyProduct } from "./shopify";

export interface Collection {
  id: string;
  label: string;
  filter: (p: ShopifyProduct) => boolean;
}

export function isCalendarProduct(p: ShopifyProduct): boolean {
  const type = p.node.productType?.toLowerCase().trim();
  if (type === "calendar") return true;

  const title = p.node.title.toLowerCase();
  const handle = p.node.handle.toLowerCase();
  const tags = (p.node.tags ?? []).map((t) => t.toLowerCase());

  return (
    title.includes("calendar") ||
    handle.includes("calendar") ||
    tags.some((t) => t === "calendar" || t.includes("calendar"))
  );
}

export function sortCalendarsFeaturedFirst(products: ShopifyProduct[]): ShopifyProduct[] {
  const yearFrom = (p: ShopifyProduct) => {
    const m = p.node.title.match(/20\d{2}/) || p.node.handle.match(/20\d{2}/);
    return m ? Number(m[0]) : 0;
  };
  return [...products].sort((a, b) => {
    const yearDiff = yearFrom(b) - yearFrom(a);
    if (yearDiff !== 0) return yearDiff;
    return a.node.title.localeCompare(b.node.title);
  });
}

export const collections: Collection[] = [
  {
    id: "all",
    label: "All",
    filter: () => true,
  },
  {
    id: "aurora",
    label: "Aurora by Cola B",
    filter: (p) => {
      const t = p.node.title.toLowerCase();
      return t.includes("aurora") && !t.includes("chloe");
    },
  },
  {
    id: "chloe",
    label: "Chloe the Cat",
    filter: (p) => p.node.title.toLowerCase().includes("chloe the cat"),
  },
  {
    id: "lovevibe",
    label: "Lovevibe",
    filter: (p) => p.node.title.toLowerCase().includes("lovevibe"),
  },
  {
    id: "meme",
    label: "Threads Meme",
    filter: (p) => p.node.title.toLowerCase().includes("meme collection"),
  },
  {
    id: "digital",
    label: "Digital Albums",
    filter: (p) => {
      const t = p.node.title.toLowerCase();
      return t.includes("digital album") || t.includes("digital download");
    },
  },
];

export function isCoffeeProduct(p: ShopifyProduct): boolean {
  const t = p.node.title.toLowerCase();
  return t.includes("coffee") || t.includes("drip bag") || t.includes("咖啡");
}
