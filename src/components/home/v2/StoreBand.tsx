import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchProducts } from "@/lib/shopify";
import { isCoffeeProduct } from "@/lib/collections";
import { ProductCard } from "@/components/store/ProductCard";
import { Reveal, Kicker } from "@/components/editorial/Reveal";
import atelier from "@/assets/campaign/atelier.jpg";

export const StoreBand = () => {
  const { t } = useTranslation();
  const { data: products = [] } = useQuery({
    queryKey: ["shopify-products-preview"],
    queryFn: () => fetchProducts(8),
    staleTime: 1000 * 60 * 5,
  });

  const filtered = products.filter((p) => !isCoffeeProduct(p)).slice(0, 3);

  return (
    <section className="paper-band band">
      <div className="editorial grid md:grid-cols-12 gap-10 md:gap-16 items-center">
        <Reveal className="md:col-span-5">
          <div className="aspect-[4/5] overflow-hidden">
            <img src={atelier} alt="Cola B — atelier" loading="lazy" className="h-full w-full object-cover" />
          </div>
        </Reveal>
        <div className="md:col-span-7">
          <Reveal delay={80}>
            <Kicker className="!text-cola-wine">{t("hp.storeLabel")}</Kicker>
            <h2 className="font-display text-section mt-4 text-balance">{t("hp.storeTitle")}</h2>
            <p className="mt-5 text-body-lg text-foreground/70 reading">{t("hp.storeBody")}</p>
            <Link
              to="/store"
              className="mt-8 inline-block px-8 py-3.5 bg-foreground text-background label hover:opacity-90 transition-opacity"
            >
              {t("hp.storeCta")}
            </Link>
          </Reveal>
        </div>
      </div>

      {filtered.length > 0 && (
        <div className="editorial mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {filtered.map((product, i) => (
            <Reveal key={product.node.id} delay={i * 80}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
};
