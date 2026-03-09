import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchProducts, type ShopifyProduct } from "@/lib/shopify";
import { Loader2 } from "lucide-react";

export const StorePreview = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts(3)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Products coming soon.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product) => {
            const { node } = product;
            const image = node.images.edges[0]?.node;
            const price = node.priceRange.minVariantPrice;
            return (
              <Link
                key={node.id}
                to={`/product/${node.handle}`}
                className="group block"
              >
                <div className="aspect-[3/4] overflow-hidden mb-4 bg-card">
                  {image ? (
                    <img
                      src={image.url}
                      alt={image.altText || node.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <h3 className="font-display text-base font-medium text-foreground group-hover:text-primary transition-colors">
                  {node.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {price.currencyCode} {parseFloat(price.amount).toFixed(2)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};
