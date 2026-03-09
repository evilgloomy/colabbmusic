import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { useCartStore } from "@/stores/cartStore";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const StorePage = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts(20)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blush via-champagne to-warm-cream" />
        <div className="relative container mx-auto px-6 py-32 md:py-40">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-4">Official</p>
          <h1 className="text-display-lg font-display font-bold text-foreground mb-6">Store</h1>
          <p className="text-muted-foreground max-w-lg">
            Premium merch and exclusive drops from Cola B's world.
          </p>
        </div>
      </section>

      {/* Products */}
      <section className="container mx-auto px-6 pb-24">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground font-display">Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-2">New drops are on the way.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {products.map((product) => (
              <StoreProductCard key={product.node.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </PageLayout>
  );
};

const StoreProductCard = ({ product }: { product: ShopifyProduct }) => {
  const { node } = product;
  const addItem = useCartStore((s) => s.addItem);
  const isLoading = useCartStore((s) => s.isLoading);
  const image = node.images.edges[0]?.node;
  const price = node.priceRange.minVariantPrice;
  const firstVariant = node.variants.edges[0]?.node;

  const handleAdd = async (e: React.MouseEvent) => {
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
    <Link to={`/product/${node.handle}`} className="group block">
      <div className="aspect-[3/4] overflow-hidden mb-5 rounded-lg relative">
        {image ? (
          <img
            src={image.url}
            alt={image.altText || node.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-card flex items-center justify-center text-muted-foreground">No image</div>
        )}
        {/* Quick add overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAdd}
            disabled={isLoading || !firstVariant?.availableForSale}
            className="w-full py-3 bg-primary text-primary-foreground text-xs font-medium tracking-wider uppercase rounded-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Adding..." : firstVariant?.availableForSale ? "Quick Add" : "Sold Out"}
          </button>
        </div>
      </div>
      <h3 className="font-display text-base font-medium text-foreground group-hover:text-primary transition-colors">
        {node.title}
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
      </p>
    </Link>
  );
};

export default StorePage;