import { Navbar } from "@/components/Navbar";
import { ProductGrid } from "@/components/ProductGrid";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-2xl">
            <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-4">
              Premium Craft Coffee
            </p>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground leading-tight mb-6">
              Cola B
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mb-8">
              Discover our curated collection of premium coffees, merch, and exclusive drops.
            </p>
            <a
              href="#products"
              className="inline-flex items-center px-8 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Shop Now
            </a>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-coffee-cream/50 to-transparent pointer-events-none hidden md:block" />
      </section>

      {/* Products */}
      <section id="products" className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-display font-bold mb-10">Our Products</h2>
        <ProductGrid />
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Cola B. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
