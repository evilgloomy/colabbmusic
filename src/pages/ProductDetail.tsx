import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShoppingCart, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { fetchProductByHandle } from "@/lib/shopify";
import type { ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";
import { useSEO, SITE_URL } from "@/hooks/useSEO";
import { trackViewContent } from "@/lib/analytics";
import { useEffect, useRef } from "react";

const ProductDetailPage = () => {
  const { handle } = useParams<{ handle: string }>();
  const addItem = useCartStore((s) => s.addItem);
  const isCartLoading = useCartStore((s) => s.isLoading);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const { data: product, isLoading } = useQuery({
    queryKey: ["shopify-product", handle],
    queryFn: () => fetchProductByHandle(handle!),
    enabled: !!handle,
  });

  const jsonLd = useMemo(() => {
    if (!product) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: product.description,
      image: product.images?.edges?.[0]?.node?.url,
      url: `${SITE_URL}/product/${product.handle}`,
      offers: {
        "@type": "Offer",
        price: product.priceRange?.minVariantPrice?.amount,
        priceCurrency: product.priceRange?.minVariantPrice?.currencyCode,
        availability: "https://schema.org/InStock",
      },
    };
  }, [product]);

  useSEO({
    title: product ? `${product.title} — Cola B Store` : "Product — Cola B Store",
    description: product?.description || "Official Cola B merchandise.",
    image: product?.images?.edges?.[0]?.node?.url,
    jsonLd,
  });

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageLayout>
    );
  }

  if (!product) {
    return (
      <PageLayout>
        <div className="container mx-auto px-6 pt-24 pb-16 text-center">
          <p className="text-muted-foreground">Product not found.</p>
          <Link to="/store" className="text-sm underline mt-4 inline-block">
            Back to Store
          </Link>
        </div>
      </PageLayout>
    );
  }

  const images = product.images?.edges || [];
  const options = product.options || [];
  const variants = product.variants?.edges || [];

  // Initialize selected options with first values if empty
  if (Object.keys(selectedOptions).length === 0 && options.length > 0) {
    const initial: Record<string, string> = {};
    options.forEach((opt: { name: string; values: string[] }) => {
      initial[opt.name] = opt.values[0];
    });
    // Use a timeout to avoid setting state during render
    setTimeout(() => setSelectedOptions(initial), 0);
  }

  const selectedVariant = variants.find(
    (v: { node: { selectedOptions: Array<{ name: string; value: string }> } }) =>
      v.node.selectedOptions.every(
        (opt: { name: string; value: string }) => selectedOptions[opt.name] === opt.value
      )
  )?.node || variants[0]?.node;

  const productAsShopifyProduct: ShopifyProduct = {
    node: {
      id: product.id,
      title: product.title,
      description: product.description,
      handle: product.handle,
      priceRange: product.priceRange,
      images: product.images,
      variants: product.variants,
      options: product.options,
    },
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    await addItem({
      product: productAsShopifyProduct,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions || [],
    });
    toast.success("Added to cart", { description: product.title, position: "top-center" });
  };

  return (
    <PageLayout>
      <section className="container mx-auto px-6 pt-24 pb-16">
        <Link
          to="/store"
          className="inline-flex items-center gap-1 text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ChevronLeft className="h-3 w-3" /> Back to Store
        </Link>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Image gallery */}
          <div>
            <div className="aspect-square bg-muted overflow-hidden mb-3">
              {images[selectedImageIndex] ? (
                <img
                  src={images[selectedImageIndex].node.url}
                  alt={images[selectedImageIndex].node.altText || product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  No image
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img: { node: { url: string; altText: string | null } }, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`w-16 h-16 flex-shrink-0 overflow-hidden border-2 transition-colors ${
                      i === selectedImageIndex ? "border-foreground" : "border-transparent"
                    }`}
                  >
                    <img src={img.node.url} alt={img.node.altText || ""} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground mb-2">
              {product.title}
            </h1>
            <p className="text-xl font-semibold text-foreground mb-6">
              ${parseFloat(selectedVariant?.price?.amount || product.priceRange.minVariantPrice.amount).toFixed(2)}{" "}
              <span className="text-sm text-muted-foreground font-normal">
                {selectedVariant?.price?.currencyCode || product.priceRange.minVariantPrice.currencyCode}
              </span>
            </p>

            {/* Options */}
            {options.map((option: { name: string; values: string[] }) => (
              <div key={option.name} className="mb-6">
                <label className="text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-2 block">
                  {option.name}
                </label>
                <div className="flex flex-wrap gap-2">
                  {option.values.map((value: string) => (
                    <button
                      key={value}
                      onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.name]: value }))}
                      className={`px-4 py-2 text-xs font-semibold tracking-wider uppercase transition-colors ${
                        selectedOptions[option.name] === value
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <Button
              onClick={handleAddToCart}
              disabled={isCartLoading || !selectedVariant?.availableForSale}
              className="w-full mt-4"
              size="lg"
            >
              {isCartLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : !selectedVariant?.availableForSale ? (
                "Sold Out"
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                </>
              )}
            </Button>

            {product.description && (
              <div className="mt-8 pt-8 border-t border-border">
                <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground mb-3">
                  Description
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default ProductDetailPage;
