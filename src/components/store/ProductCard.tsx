import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import type { ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "sonner";

interface ProductCardProps {
  product: ShopifyProduct;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { node } = product;
  const addItem = useCartStore(s => s.addItem);
  const isLoading = useCartStore(s => s.isLoading);
  const image = node.images.edges[0]?.node;
  const price = node.priceRange.minVariantPrice;
  const firstVariant = node.variants.edges[0]?.node;

  const handleQuickAdd = async (e: React.MouseEvent) => {
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
    toast.success("Added to cart", { description: node.title, position: "top-center" });
  };

  return (
    <Link to={`/product/${node.handle}`} className="group block">
      <div className="aspect-[3/4] overflow-hidden bg-card mb-4 relative">
        {image ? (
          <img
            src={image.url}
            alt={image.altText || node.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
        <button
          onClick={handleQuickAdd}
          disabled={isLoading || !firstVariant?.availableForSale}
          className="absolute bottom-3 right-3 p-2.5 bg-background/90 backdrop-blur-sm text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
          aria-label="Add to cart"
        >
          <ShoppingCart className="h-4 w-4" />
        </button>
      </div>
      <h3 className="text-xs font-semibold tracking-[0.1em] uppercase text-foreground mb-1 line-clamp-2">
        {node.title}
      </h3>
      <p className="text-sm text-muted-foreground">
        {price.currencyCode} ${parseFloat(price.amount).toFixed(2)}
      </p>
      {firstVariant && !firstVariant.availableForSale && (
        <p className="text-[10px] text-destructive mt-1 uppercase tracking-wider">Sold out</p>
      )}
    </Link>
  );
};
