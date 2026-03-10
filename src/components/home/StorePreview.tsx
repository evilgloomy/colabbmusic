import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchProducts } from "@/lib/shopify";
import { isCoffeeProduct } from "@/lib/collections";
import { ProductCard } from "@/components/store/ProductCard";

export const StorePreview = () => {
  const { data: products = [] } = useQuery({
    queryKey: ["shopify-products-preview"],
    queryFn: () => fetchProducts(8),
    staleTime: 1000 * 60 * 5,
  });

  const filtered = products.filter((p) => !isCoffeeProduct(p)).slice(0, 4);

  return (
    <section className="container mx-auto px-6 py-24 md:py-32">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-3">
            Shop
          </p>
          <h2 className="text-display-md font-display font-bold text-foreground">
            Store
          </h2>
        </div>
        <Link
          to="/store"
          className="text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          View All →
        </Link>
      </div>
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
          {filtered.map((product) => (
            <ProductCard key={product.node.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-6">
            Browse Cola B's official merchandise and music.
          </p>
          <Link
            to="/store"
            className="inline-flex items-center px-8 py-3 bg-primary text-primary-foreground font-medium text-sm tracking-widest uppercase hover:bg-primary/90 transition-colors"
          >
            Shop Now
          </Link>
        </div>
      )}
    </section>
  );
};
