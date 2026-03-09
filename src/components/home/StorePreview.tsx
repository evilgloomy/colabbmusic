const SHOPIFY_STORE_URL = "https://909d73.myshopify.com";

export const StorePreview = () => {
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
        <a
          href={SHOPIFY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          Visit Store →
        </a>
      </div>
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-6">
          Browse Cola B's official merchandise and music on the store.
        </p>
        <a
          href={SHOPIFY_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-8 py-3 bg-primary text-primary-foreground font-medium text-sm tracking-widest uppercase hover:bg-primary/90 transition-colors"
        >
          Shop Now
        </a>
      </div>
    </section>
  );
};
