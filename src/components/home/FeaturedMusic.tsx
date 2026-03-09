import { Link } from "react-router-dom";
import { releases } from "@/data/content";
import { Music } from "lucide-react";

export const FeaturedMusic = () => {
  const featured = releases.slice(0, 4);

  return (
    <section className="bg-card/30">
      <div className="container mx-auto px-6 py-24 md:py-32">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-3">
              Featured
            </p>
            <h2 className="text-display-md font-display font-bold text-foreground">
              Music
            </h2>
          </div>
          <Link
            to="/music"
            className="hidden md:block text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {featured.map((release, i) => (
            <Link
              key={release.id}
              to="/music"
              className="group block animate-fade-in opacity-0"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="aspect-square overflow-hidden mb-4 relative">
                <img
                  src={release.coverImage}
                  alt={release.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors flex items-center justify-center">
                  <Music className="h-8 w-8 text-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <h3 className="font-display text-sm md:text-base font-medium text-foreground group-hover:text-primary transition-colors">
                {release.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {release.year} · {release.releaseType === "ep" ? "EP" : release.releaseType.charAt(0).toUpperCase() + release.releaseType.slice(1)}
              </p>
            </Link>
          ))}
        </div>

        <Link
          to="/music"
          className="md:hidden block mt-8 text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          View All Music →
        </Link>
      </div>
    </section>
  );
};
