import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, MapPin, Calendar } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { useSEO, SITE_URL } from "@/hooks/useSEO";
import { useTranslation } from "react-i18next";

interface Story {
  id: string;
  ai_title: string | null;
  ai_enhanced_text: string | null;
  original_text: string | null;
  category: string | null;
  media_url: string | null;
  media_type: string | null;
  permalink: string | null;
  posted_at: string | null;
  location: string | null;
}

const StoryDetailPage = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("zh") ? "zh-HK" : "en-US";
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("stories")
        .select("id, ai_title, ai_enhanced_text, original_text, category, media_url, media_type, permalink, posted_at, location")
        .eq("id", id)
        .single();
      if (data) setStory(data);
      setLoading(false);
    };
    fetch();
  }, [id]);

  const jsonLd = useMemo(() => {
    if (!story) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: story.ai_title || "Story",
      description: story.ai_enhanced_text || "",
      image: story.media_url || undefined,
      datePublished: story.posted_at || undefined,
      author: { "@type": "Person", name: "Cola B" },
      url: `${SITE_URL}/story/${story.id}`,
    };
  }, [story]);

  useSEO({
    title: story ? `${story.ai_title || "Story"} — Cola B` : undefined,
    description: story?.ai_enhanced_text || undefined,
    image: story?.media_url,
    type: "article",
    jsonLd,
  });

  if (loading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-6 py-32">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            <div className="aspect-[4/3] bg-muted animate-pulse rounded-xl" />
            <div className="h-8 w-2/3 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!story) {
    return (
      <PageLayout>
        <div className="container mx-auto px-6 py-32 text-center">
          <h1 className="text-display-md font-display font-bold text-foreground mb-4">{t("story.storyNotFound")}</h1>
          <Link to="/story" className="text-primary hover:underline text-sm">{t("story.backToStories")}</Link>
        </div>
      </PageLayout>
    );
  }

  const isVideo = story.media_type === "VIDEO";
  const formattedDate = story.posted_at
    ? new Date(story.posted_at).toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <PageLayout>
      <article className="container mx-auto px-6 py-24 md:py-32">
        <div className="max-w-3xl mx-auto">
          <Link to="/story" className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("story.allStories")}
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-sm">
              {story.category || t("common.lifestyle")}
            </span>
            {story.location && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{story.location}</span>
            )}
            {formattedDate && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" />{formattedDate}</span>
            )}
          </div>

          <h1 className="text-display-md font-display font-bold text-foreground mb-8">{story.ai_title || t("common.untitled")}</h1>

          {story.media_url && (
            <div className="rounded-xl overflow-hidden mb-10">
              {isVideo ? (
                <video src={story.media_url} controls muted autoPlay playsInline loop preload="auto" className="w-full rounded-xl" />
              ) : (
                <img src={story.media_url} alt={story.ai_title || t("common.untitled")} className="w-full h-auto rounded-xl" loading="eager" />
              )}
            </div>
          )}

          {story.ai_enhanced_text && <p className="text-lg md:text-xl leading-relaxed text-foreground mb-8">{story.ai_enhanced_text}</p>}

          {story.permalink && (
            <a href={story.permalink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase text-muted-foreground hover:text-primary transition-colors">
              {t("story.viewOnThreads")} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </article>
    </PageLayout>
  );
};

export default StoryDetailPage;
