import { Link } from "react-router-dom";
import { getActiveCampaign, brand } from "@/data/content";

export const HeroSection = () => {
  const campaign = getActiveCampaign();

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={campaign.coverImage}
          alt=""
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-6 py-32 text-center">
        <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-8 animate-fade-in opacity-0" style={{ animationDelay: "0.2s" }}>
          Singer-Songwriter · Cultural Personality
        </p>
        <h1 className="text-hero font-display font-bold text-foreground mb-6 animate-fade-in opacity-0" style={{ animationDelay: "0.4s" }}>
          {brand.name}
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto mb-12 animate-fade-in opacity-0" style={{ animationDelay: "0.6s" }}>
          A world built through music, style, and moments.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in opacity-0" style={{ animationDelay: "0.8s" }}>
          <Link
            to="/music"
            className="px-8 py-3.5 bg-primary text-primary-foreground text-sm font-medium tracking-wider uppercase hover:bg-primary/90 transition-colors"
          >
            Listen Now
          </Link>
          <Link
            to="/story"
            className="px-8 py-3.5 border border-foreground/20 text-foreground text-sm font-medium tracking-wider uppercase hover:border-foreground/50 transition-colors"
          >
            Enter Her World
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in opacity-0" style={{ animationDelay: "1.2s" }}>
        <div className="w-px h-12 bg-gradient-to-b from-transparent to-muted-foreground/40" />
      </div>
    </section>
  );
};
