import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { ProductCard } from "@/components/store/ProductCard";
import { fetchProducts } from "@/lib/shopify";
import { collections, isCoffeeProduct } from "@/lib/collections";
import { useSEO, SITE_URL } from "@/hooks/useSEO";
import { buildBreadcrumb } from "@/components/seo/JsonLd";
import { useTranslation } from "react-i18next";
import bannerStore from "@/assets/banner-store.jpg";
import { publishableOnly, isPublishableProduct } from "@/lib/publishable";

const StorePage = () => {
  const { t } = useTranslation();

  const breadcrumbJsonLd = buildBreadcrumb([{ name: "Home", url: "/" }, { name: "Store", url: "/store" }], SITE_URL);

  useSEO({
    title: t("store.pageTitle") + " — Cola B",
    description:
      "Shop official Cola B merchandise — exclusive apparel, vinyl, accessories, and limited-edition drops shipped worldwide from Cola B.",
    jsonLd: breadcrumbJsonLd,
  });

  const [activeCollection, setActiveCollection] = useState("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shopify-products"],
    queryFn: () => fetchProducts(100),
    staleTime: 1000 * 60 * 5,
  });

  const filteredProducts = publishableOnly(products, isPublishableProduct, "store/products")
    .filter((p) => !isCoffeeProduct(p))
    .filter((p) => {
      const col = collections.find((c) => c.id === activeCollection);
      return col ? col.filter(p) : true;
    });

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src={bannerStore} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/50 to-background" />
        <div className="relative editorial py-32 md:py-44">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-4">{t("store.shop")}</p>
          <h1 className="text-display-lg font-display font-bold text-foreground mb-4">{t("store.pageTitle")}</h1>
        </div>
      </section>

      {/* Collection filters */}
      <section className="border-b border-border/40">
        <div className="editorial py-4">
          <div className="flex flex-wrap gap-1">
            {collections.map((col) => (
              <button
                key={col.id}
                onClick={() => setActiveCollection(col.id)}
                className={`px-4 py-2 text-[11px] font-medium tracking-[0.12em] uppercase transition-colors ${
                  activeCollection === col.id
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section className="editorial py-16 md:py-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-muted-foreground">{t("store.noProducts")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12">
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
