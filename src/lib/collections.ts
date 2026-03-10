import type { ShopifyProduct } from "./shopify";

export interface Collection {
  id: string;
  label: string;
  filter: (p: ShopifyProduct) => boolean;
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
