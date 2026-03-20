import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchProducts } from "@/lib/shopify";
import { isCoffeeProduct } from "@/lib/collections";
import { ProductCard } from "@/components/store/ProductCard";
import { useTranslation } from "react-i18next";

export const StorePreview = () => {
  const { t } = useTranslation();
  const { data: products = [] } = useQuery({
    queryKey: ["shopify-products-preview"],
    queryFn: () => fetchProducts(8),
    staleTime: 1000 * 60 * 5,
  });

  const filtered = products.filter((p) => !isCoffeeProduct(p)).slice(0, 3);

  return (
    <section className="border-t border-border/40">
      <div className="container mx-auto px-6 py-24 md:py-32">
        <div className="flex items-end justify-between mb-14">
          <div>
            <p className="text-xs font-body font-medium tracking-[0.3em] uppercase text-muted-foreground mb-3">{t("home.shop")}</p>
            <h2 className="text-display-md font-display font-semibold text-foreground">{t("home.store")}</h2>
          </div>
          <Link to="/store" className="text-xs font-body font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
            {t("home.viewAllArrow")}
          </Link>
        </div>
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {filtered.map((product) => (
              <ProductCard key={product.node.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-6 font-body">{t("home.browseMerch")}</p>
            <Link to="/store" className="inline-flex items-center px-8 py-3 bg-foreground text-background font-body font-medium text-sm tracking-widest uppercase hover:opacity-90 transition-opacity">
              {t("home.shopNow")}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
