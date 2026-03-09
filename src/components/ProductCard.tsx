import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import type { ShopifyProduct } from "@/lib/shopify";
import { toast } from "sonner";

interface ProductCardProps {
  product: ShopifyProduct;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { node } = product;
  const addItem = useCartStore(state => state.addItem);
  const isLoading = useCartStore(state => state.isLoading);
  const image = node.images.edges[0]?.node;
  const price = node.priceRange.minVariantPrice;
  const firstVariant = node.variants.edges[0]?.node;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant) return;
    await addItem({
      product,
      variantId: firstVariant.id,
      variantTitle: firstVariant.title,
      price: firstVariant.price,
      quantity: 1,
      selectedOptions: firstVariant.selectedOptions || [],
    });
    toast.success(`${node.title} added to cart`);
  };

  return (
    <Link
      to={`/product/${node.handle}`}
      className="group block animate-fade-in"
    >
      <div className="aspect-square rounded-lg overflow-hidden bg-card mb-3">
        {image ? (
          <img
            src={image.url}
            alt={image.altText || node.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">
          {node.title}
        </h3>
        <p className="text-sm font-semibold">
          {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="w-full mt-2 text-xs"
          onClick={handleAddToCart}
          disabled={isLoading || !firstVariant?.availableForSale}
        >
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : firstVariant?.availableForSale ? "Add to Cart" : "Sold Out"}
        </Button>
      </div>
    </Link>
  );
};
