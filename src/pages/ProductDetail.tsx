import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchProductByHandle } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { PageLayout } from "@/components/layout/PageLayout";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProductData {
  id: string;
  title: string;
  description: string;
  handle: string;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  images: { edges: Array<{ node: { url: string; altText: string | null } }> };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        price: { amount: string; currencyCode: string };
        availableForSale: boolean;
        selectedOptions: Array<{ name: string; value: string }>;
      };
    }>;
  };
  options: Array<{ name: string; values: string[] }>;
}

const ProductDetail = () => {
  const { handle } = useParams<{ handle: string }>();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);

  useEffect(() => {
    if (!handle) return;
    setLoading(true);
    fetchProductByHandle(handle)
      .then(setProduct)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [handle]);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageLayout>
    );
  }

  if (!product) {
    return (
      <PageLayout>
        <div className="container mx-auto px-6 py-32 text-center">
          <p className="text-xl text-muted-foreground font-display">Product not found</p>
          <Link to="/store" className="text-primary text-sm mt-4 inline-block">Back to store</Link>
        </div>
      </PageLayout>
    );
  }

  const selectedVariant = product.variants.edges[selectedVariantIndex]?.node;
  const images = product.images.edges;

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    await addItem({
      product: {
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
      },
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions || [],
    });
    toast.success(`${product.title} added to cart`);
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-6 py-12">
        <Link
          to="/store"
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors mb-12"
        >
          <ArrowLeft className="h-4 w-4" /> Back to store
        </Link>

        <div className="grid md:grid-cols-2 gap-12 md:gap-20">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden bg-card">
              {images[selectedImage]?.node ? (
                <img
                  src={images[selectedImage].node.url}
                  alt={images[selectedImage].node.altText || product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 overflow-hidden flex-shrink-0 border transition-colors ${
                      idx === selectedImage ? "border-primary" : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <img src={img.node.url} alt={img.node.altText || ""} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-8">
            <div>
              <h1 className="text-display-md font-display font-bold">{product.title}</h1>
              <p className="text-xl text-foreground mt-3">
                {selectedVariant?.price.currencyCode} {parseFloat(selectedVariant?.price.amount || "0").toFixed(2)}
              </p>
            </div>

            {/* Variants */}
            {product.options
              .filter((o) => o.name !== "Title" || o.values.length > 1)
              .map((option) => (
                <div key={option.name} className="space-y-3">
                  <label className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
                    {option.name}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {option.values.map((value) => {
                      const variantIndex = product.variants.edges.findIndex((v) =>
                        v.node.selectedOptions.some((so) => so.name === option.name && so.value === value)
                      );
                      const isSelected = product.variants.edges[selectedVariantIndex]?.node.selectedOptions.some(
                        (so) => so.name === option.name && so.value === value
                      );
                      return (
                        <button
                          key={value}
                          onClick={() => variantIndex >= 0 && setSelectedVariantIndex(variantIndex)}
                          className={`px-5 py-2.5 text-xs font-medium tracking-wider uppercase transition-colors ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                          }`}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

            <button
              onClick={handleAddToCart}
              disabled={isLoading || !selectedVariant?.availableForSale}
              className="w-full py-4 bg-primary text-primary-foreground text-sm font-medium tracking-wider uppercase hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Adding..." : selectedVariant?.availableForSale ? "Add to Cart" : "Sold Out"}
            </button>

            {product.description && (
              <div className="pt-6 border-t border-border/40">
                <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">
                  Description
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ProductDetail;
