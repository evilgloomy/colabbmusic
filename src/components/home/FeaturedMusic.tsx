import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchReleases, type YouTubeRelease } from "@/lib/youtube";
import { Music } from "lucide-react";
import { useTranslation } from "react-i18next";

export const FeaturedMusic = () => {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState<YouTubeRelease[]>([]);

  useEffect(() => {
    fetchReleases().then((releases) => {
      const albums = releases.filter(r => (r.track_count ?? 0) > 1);
      setFeatured((albums.length >= 4 ? albums : releases).slice(0, 4));
    });
  }, []);

  if (featured.length === 0) return null;

  return (
    <section className="border-t border-border/40">
      <div className="container mx-auto px-6 py-24 md:py-32">
        <div className="flex items-end justify-between mb-14">
          <div>
            <p className="text-xs font-body font-medium tracking-[0.3em] uppercase text-muted-foreground mb-3">
              {t("home.featured")}
            </p>
            <h2 className="text-display-md font-display font-semibold text-foreground">
              {t("home.music")}
            </h2>
          </div>
          <Link to="/music" className="hidden md:block text-xs font-body font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
            {t("home.viewAllArrow")}
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {featured.map((release, i) => {
            const decodedThumb = release.thumbnail_url?.replace(/&amp;/g, '&');
            return (
              <Link key={release.id} to={`/release/${release.id}`} className="group block animate-fade-in opacity-0" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="aspect-square overflow-hidden mb-4 relative bg-muted">
                  {decodedThumb ? (
                    <img src={decodedThumb} alt={release.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Music className="h-8 w-8" /></div>
                  )}
                </div>
                <h3 className="font-body text-sm font-medium text-foreground group-hover:text-primary transition-colors">{release.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 font-body">
                  {release.year}{release.track_count && release.track_count > 1 ? ` · ${release.track_count} ${t("home.tracks")}` : ''}
                </p>
              </Link>
            );
          })}
        </div>

        <Link to="/music" className="md:hidden block mt-10 text-xs font-body font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
          {t("home.viewAllMusic")}
        </Link>
      </div>
    </section>
  );
};
