import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { fetchProducts } from "@/lib/shopify";
import { collections, isCoffeeProduct } from "@/lib/collections";
import bannerStore from "@/assets/banner-store.jpg";

const StorePage = () => {
  const [activeCollection, setActiveCollection] = useState("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shopify-products"],
    queryFn: () => fetchProducts(100),
    staleTime: 1000 * 60 * 5,
  });

  const filteredProducts = products
    .filter((p) => !isCoffeeProduct(p))
    .filter((p) => {
      const col = collections.find((c) => c.id === activeCollection);
      return col ? col.filter(p) : true;
    });

  return (
    <PageLayout>
      <section className="container mx-auto px-6 pt-24 pb-16">
        <div className="mb-12">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-3">
            Shop
          </p>
          <h1 className="text-display-md font-display font-bold text-foreground">
            Store
          </h1>
        </div>

        {/* Collection tabs */}
        <div className="flex flex-wrap gap-2 mb-10">
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => setActiveCollection(col.id)}
              className={`px-4 py-2 text-xs font-semibold tracking-[0.12em] uppercase transition-colors ${
                activeCollection === col.id
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {col.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground">No products found in this collection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {filteredProducts.map((product) => (
              <ProductCard key={product.node.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </PageLayout>
  );
};

export default StorePage;
