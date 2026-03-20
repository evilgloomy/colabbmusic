import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface Story {
  id: string;
  ai_title: string | null;
  ai_enhanced_text: string | null;
  category: string | null;
  media_url: string | null;
  media_type: string | null;
  posted_at: string | null;
}

export const StoryPreview = () => {
  const { t } = useTranslation();
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    const fetchStories = async () => {
      const { data } = await supabase
        .from("stories")
        .select("id, ai_title, ai_enhanced_text, category, media_url, media_type, posted_at")
        .order("posted_at", { ascending: false })
        .limit(4);
      if (data) setStories(data);
    };
    fetchStories();
  }, []);

  if (stories.length === 0) return null;

  const featured = stories[0];
  const rest = stories.slice(1);

  return (
    <section className="border-t border-border/40">
      <div className="container mx-auto px-6 py-24 md:py-32">
        <div className="flex items-end justify-between mb-14">
          <div>
            <p className="text-xs font-body font-medium tracking-[0.3em] uppercase text-muted-foreground mb-3">
              {t("home.fromHerWorld")}
            </p>
            <h2 className="text-display-md font-display font-semibold text-foreground">
              {t("home.insideColasWorld")}
            </h2>
          </div>
          <Link to="/story" className="text-xs font-body font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
            {t("home.viewAll")} <ChevronRight className="inline h-3 w-3" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Featured story — large */}
          <Link to={`/story/${featured.id}`} className="group block">
            <div className="aspect-[4/3] overflow-hidden bg-muted mb-4 relative">
              {featured.media_url ? (
                featured.media_type === "VIDEO" ? (
                  <video src={featured.media_url} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" muted autoPlay loop playsInline preload="auto" />
                ) : (
                  <img src={featured.media_url} alt={featured.ai_title || ""} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" loading="lazy" />
                )
              ) : (
                <div className="w-full h-full bg-muted" />
              )}
              {featured.media_type === "VIDEO" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="h-8 w-8 text-white drop-shadow-lg" />
                </div>
              )}
            </div>
            <p className="text-[10px] font-body font-medium tracking-[0.2em] uppercase text-muted-foreground mb-1">
              {featured.category || t("common.lifestyle")}
            </p>
            <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {featured.ai_title || t("common.untitled")}
            </h3>
          </Link>

          {/* Remaining stories — stacked */}
          <div className="flex flex-col gap-5">
            {rest.map((story) => (
              <Link key={story.id} to={`/story/${story.id}`} className="group flex gap-4 items-start">
                {story.media_url && (
                  <div className="w-20 h-20 flex-shrink-0 overflow-hidden bg-muted">
                    {story.media_type === "VIDEO" ? (
                      <video src={story.media_url} className="w-full h-full object-cover" muted autoPlay loop playsInline preload="auto" />
                    ) : (
                      <img src={story.media_url} alt={story.ai_title || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    )}
                  </div>
                )}
                <div className="min-w-0 pt-0.5">
                  <p className="text-[10px] font-body font-medium tracking-[0.15em] uppercase text-muted-foreground mb-1">
                    {story.category || t("common.lifestyle")}
                  </p>
                  <p className="text-sm font-display font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {story.ai_title || t("common.untitled")}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1 font-body">
                    {story.ai_enhanced_text || ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
