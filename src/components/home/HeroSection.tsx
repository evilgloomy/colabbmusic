import { Link } from "react-router-dom";
import { brand } from "@/data/content";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[100vh] flex items-end overflow-hidden">
      {/* Warm bokeh-style background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blush via-champagne to-warm-cream" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 70% 30%, hsl(340 30% 75% / 0.5), transparent), radial-gradient(ellipse 40% 40% at 30% 60%, hsl(35 50% 80% / 0.4), transparent), radial-gradient(ellipse 50% 50% at 80% 70%, hsl(350 35% 80% / 0.3), transparent)",
        }}
      />

      {/* Content — left-aligned, bottom portion */}
      <div className="relative container mx-auto px-6 pb-20 md:pb-28 pt-40">
        <h1 className="text-hero font-display font-bold text-foreground mb-4 animate-fade-in opacity-0" style={{ animationDelay: "0.2s" }}>
          COLA B
        </h1>
        <p className="text-lg md:text-xl font-display italic text-foreground/80 mb-2 animate-fade-in opacity-0" style={{ animationDelay: "0.4s" }}>
          Digital Singer-Songwriter.
        </p>
        <p className="text-sm md:text-base text-muted-foreground max-w-md mb-10 animate-fade-in opacity-0" style={{ animationDelay: "0.6s" }}>
          Living her music, life, and moments.
        </p>
        <div className="flex flex-wrap items-center gap-4 animate-fade-in opacity-0" style={{ animationDelay: "0.8s" }}>
          <Link
            to="/music"
            className="px-8 py-3.5 bg-primary text-primary-foreground text-sm font-medium tracking-wider uppercase rounded-sm hover:bg-primary/90 transition-colors"
          >
            Listen Now
          </Link>
          <Link
            to="/videos"
            className="px-8 py-3.5 border border-foreground/20 text-foreground text-sm font-medium tracking-wider uppercase rounded-sm hover:border-primary hover:text-primary transition-colors"
          >
            Watch Video
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-fade-in opacity-0" style={{ animationDelay: "1.2s" }}>
        <div className="w-px h-10 bg-gradient-to-b from-transparent to-muted-foreground/30" />
      </div>
    </section>
  );
};