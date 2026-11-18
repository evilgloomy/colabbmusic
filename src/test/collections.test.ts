import { describe, expect, it } from "vitest";
import { isCalendarProduct, sortCalendarsFeaturedFirst } from "@/lib/collections";
import type { ShopifyProduct } from "@/lib/shopify";

const product = (overrides: Partial<ShopifyProduct["node"]>): ShopifyProduct => ({
  node: {
    id: "gid://shopify/Product/1",
    title: "Tee",
    description: "",
    handle: "tee",
    priceRange: { minVariantPrice: { amount: "10.00", currencyCode: "USD" } },
    images: { edges: [] },
    variants: { edges: [] },
    options: [],
    ...overrides,
  },
});

describe("isCalendarProduct", () => {
  it("matches product type Calendar", () => {
    expect(isCalendarProduct(product({ productType: "Calendar", title: "Afterdark", handle: "afterdark" }))).toBe(true);
  });

  it("matches title or handle when type is missing", () => {
    expect(isCalendarProduct(product({ title: "2027 Wall Calendar", handle: "2027-wall-calendar" }))).toBe(true);
    expect(isCalendarProduct(product({ title: "Official merch", handle: "official-merch", tags: ["Calendar"] }))).toBe(true);
    expect(isCalendarProduct(product({ title: "Signature Hoodie", handle: "signature-hoodie" }))).toBe(false);
  });
});

describe("sortCalendarsFeaturedFirst", () => {
  it("orders by year descending", () => {
    const items = [
      product({ title: "Cola B 2025 Wall Calendar", handle: "2025" }),
      product({ title: "2027 Wall Calendar", handle: "2027" }),
      product({ title: "Official Cola B 2026 Wall Calendar", handle: "2026" }),
    ];
    expect(sortCalendarsFeaturedFirst(items).map((p) => p.node.handle)).toEqual(["2027", "2026", "2025"]);
  });
});
