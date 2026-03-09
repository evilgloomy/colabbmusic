import { Link } from "react-router-dom";
import { Play, ChevronRight } from "lucide-react";
import { getFeaturedVideo } from "@/data/content";

const SHOPIFY_STORE_URL = "https://www.colabbshop.com";

export const StoryPreview = () => {
  const video = getFeaturedVideo();

  return (
    <section className="bg-background">
      <div className="container mx-auto px-6 py-20 md:py-28">
        <h2 className="text-display-md font-display font-bold text-foreground mb-10">
          Inside Cola's World
        </h2>

        {/* Two-column grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* STYLE & MERCH */}
          <div className="rounded-xl overflow-hidden bg-card border border-border/50">
            <div className="p-5 pb-3">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">
                Style & Merch
              </p>
            </div>
            <div className="px-5 pb-5 grid grid-cols-2 gap-4">
              {/* Tile 1 */}
              <div className="group">
                <div className="aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-muted">
                  <img
                    src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80"
                    alt="Aurora Hoodie"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <p className="text-xs font-semibold text-foreground">Aurora Hoodie</p>
                <p className="text-[10px] text-muted-foreground">(with signature heart embroidery)</p>
              </div>
              {/* Tile 2 */}
              <div className="group">
                <div className="aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-muted">
                  <img
                    src="https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=500&q=80"
                    alt="Heartbreaker Cap"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <p className="text-xs font-semibold text-foreground">Heartbreaker Cap</p>
              </div>
            </div>
          </div>

          {/* DIGITAL CONTENT */}
          {video && (
            <div className="rounded-xl overflow-hidden bg-card border border-border/50">
              <div className="p-5 pb-3">
                <p className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">
                  Digital Content
                </p>
              </div>
              <div className="px-5 pb-5">
                <div className="aspect-[4/3] rounded-lg overflow-hidden relative group cursor-pointer">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/10 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform border border-white/30">
                      <Play className="h-6 w-6 text-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-sm font-semibold text-white">
                      New Video: "Pastel Dreams"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Visit the Store CTA */}
        <div className="mt-8">
          <a
            href={SHOPIFY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full md:w-auto md:min-w-[400px] mx-auto px-10 py-4 rounded-full text-sm font-bold tracking-[0.15em] uppercase transition-all hover:scale-105 hover:shadow-xl"
            style={{
              background: "linear-gradient(135deg, hsl(260 35% 85% / 0.6), hsl(35 50% 85% / 0.6))",
              backdropFilter: "blur(20px)",
              border: "1px solid hsl(260 30% 80% / 0.3)",
              color: "hsl(240 10% 25%)",
            }}
          >
            Visit the Store <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
};
