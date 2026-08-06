import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { publishableOnly, isPublishableStory } from "@/lib/publishable";
import { useSEO, SITE_URL } from "@/hooks/useSEO";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import bannerStory from "@/assets/banner-story.jpg";

interface Story {
  id: string;
  ai_title: string | null;
  ai_enhanced_text: string | null;
  category: string | null;
  media_url: string | null;
  media_type: string | null;
  permalink: string | null;
  posted_at: string | null;
  location: string | null;
  featured: boolean | null;
}

const categoryKeys = ["all", "music", "travel", "fashion", "events", "studio", "lifestyle", "humor"] as const;

const StoryPage = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("zh") ? "zh-HK" : "en-US";

  const [filter, setFilter] = useState<string>("all");
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  const itemListJsonLd = useMemo(() => {
    const items = stories.filter((s) => s.media_url).slice(0, 30);
    if (!items.length) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: items.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/story/${s.id}`,
        name: s.ai_title || "Story",
      })),
    };
  }, [stories]);

  useSEO({
    title: t("story.pageTitle") + " — Cola B",
    description: t("story.pageDesc"),
    jsonLd: itemListJsonLd,
  });

  useEffect(() => {
    const fetchStories = async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("id, ai_title, ai_enhanced_text, category, media_url, media_type, permalink, posted_at, location, featured")
        .order("posted_at", { ascending: false });
      if (!error && data) setStories(data);
      setLoading(false);
    };
    fetchStories();
  }, []);

  const withMedia = publishableOnly(stories, (s) => isPublishableStory(s) && !!s.media_url, "world/stories");
  const filtered = filter === "all" ? withMedia : withMedia.filter((s) => s.category === filter);

  // Split into featured (first item) and rest for editorial hierarchy
  const featuredStory = filtered[0];
  const secondaryStories = filtered.slice(1, 3);
  const archiveStories = filtered.slice(3);

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src={bannerStory} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/50 to-background" />
        <div className="relative editorial py-32 md:py-44">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-4">{t("story.herWorld")}</p>
          <h1 className="text-display-lg font-display font-bold text-foreground mb-4">{t("story.pageTitle")}</h1>
          <p className="text-muted-foreground max-w-md text-sm">{t("story.pageDesc")}</p>
        </div>
      </section>

      {/* Filter bar */}
      <section className="border-b border-border/40">
        <div className="editorial py-4">
          <div className="flex flex-wrap gap-1">
            {categoryKeys.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 text-[11px] font-medium tracking-[0.15em] uppercase transition-colors ${
                  filter === cat
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`story.categories.${cat}`)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Editorial content */}
      <section className="editorial py-16 md:py-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8">
              <div className="aspect-[16/10] bg-muted animate-pulse" />
            </div>
            <div className="md:col-span-4 space-y-6">
              <div className="aspect-[4/3] bg-muted animate-pulse" />
              <div className="aspect-[4/3] bg-muted animate-pulse" />
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">
            {stories.length === 0 ? t("story.noStoriesYet") : t("story.noCategoryStories")}
          </p>
        ) : (
          <>
            {/* Featured + Secondary: editorial asymmetric layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-16">
              {/* Featured large card */}
              {featuredStory && (
                <div className="md:col-span-8">
                  <FeaturedCard story={featuredStory} locale={locale} />
                </div>
              )}

              {/* Two secondary cards stacked */}
              {secondaryStories.length > 0 && (
                <div className="md:col-span-4 flex flex-col gap-6">
                  {secondaryStories.map((story) => (
                    <SecondaryCard key={story.id} story={story} locale={locale} />
                  ))}
                </div>
              )}
            </div>

            {/* Archive grid */}
            {archiveStories.length > 0 && (
              <>
                <div className="mb-8">
                  <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground">{t("story.archive") || "Archive"}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                  {archiveStories.map((story) => (
                    <ArchiveCard key={story.id} story={story} locale={locale} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </PageLayout>
  );
};

/* ─── Featured Card (large, cinematic) ─── */
const FeaturedCard = ({ story, locale }: { story: Story; locale: string }) => {
  const { t } = useTranslation();
  return (
    <Link to={`/story/${story.id}`} className="group block relative overflow-hidden">
      <div className="aspect-[16/10] md:aspect-[16/9] relative overflow-hidden bg-card">
        {story.media_url ? (
          story.media_type === "VIDEO" ? (
            <video
              src={story.media_url}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
              muted autoPlay loop playsInline preload="auto"
            />
          ) : (
            <img
              src={story.media_url}
              alt={story.ai_title || t("common.untitled")}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
              loading="eager"
            />
          )
        ) : null}
        {story.media_type === "VIDEO" && story.media_url && (
          <div className="absolute top-4 right-4 z-10 w-8 h-8 bg-foreground/30 backdrop-blur-sm flex items-center justify-center">
            <Play className="h-3.5 w-3.5 text-white ml-0.5" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/80">
              {story.category || t("common.lifestyle")}
            </span>
            {story.location && (
              <span className="text-[10px] text-white/50">· {story.location}</span>
            )}
          </div>
          <h2 className="font-display text-xl md:text-2xl font-semibold text-white mb-2 line-clamp-2">
            {story.ai_title || t("common.untitled")}
          </h2>
          <p className="text-white/70 text-sm line-clamp-2 max-w-lg">{story.ai_enhanced_text || ""}</p>
          {story.posted_at && (
            <p className="text-[10px] text-white/70 mt-3">
              {new Date(story.posted_at).toLocaleDateString(locale, { month: "long", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

/* ─── Secondary Card (medium, stacked) ─── */
const SecondaryCard = ({ story, locale }: { story: Story; locale: string }) => {
  const { t } = useTranslation();
  return (
    <Link to={`/story/${story.id}`} className="group block relative overflow-hidden flex-1">
      <div className="aspect-[4/3] relative overflow-hidden bg-card">
        {story.media_url ? (
          story.media_type === "VIDEO" ? (
            <video
              src={story.media_url}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              muted autoPlay loop playsInline preload="auto"
            />
          ) : (
            <img
              src={story.media_url}
              alt={story.ai_title || t("common.untitled")}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
          )
        ) : null}
        {story.media_type === "VIDEO" && story.media_url && (
          <div className="absolute top-3 right-3 z-10 w-7 h-7 bg-foreground/30 backdrop-blur-sm flex items-center justify-center">
            <Play className="h-3 w-3 text-white ml-0.5" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-white/70 mb-1 block">
            {story.category || t("common.lifestyle")}
          </span>
          <h3 className="font-display text-sm font-medium text-white line-clamp-2">
            {story.ai_title || t("common.untitled")}
          </h3>
          {story.posted_at && (
            <p className="text-[9px] text-white/70 mt-1">
              {new Date(story.posted_at).toLocaleDateString(locale, { month: "short", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

/* ─── Archive Card (compact grid) ─── */
const ArchiveCard = ({ story, locale }: { story: Story; locale: string }) => {
  const { t } = useTranslation();
  return (
    <Link to={`/story/${story.id}`} className="group block">
      <div className="aspect-[3/4] relative overflow-hidden bg-card mb-3">
        {story.media_url ? (
          story.media_type === "VIDEO" ? (
            <video
              src={story.media_url}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              muted autoPlay loop playsInline preload="auto"
            />
          ) : (
            <img
              src={story.media_url}
              alt={story.ai_title || t("common.untitled")}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          )
        ) : null}
        {story.media_type === "VIDEO" && story.media_url && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-foreground/30 backdrop-blur-sm flex items-center justify-center">
            <Play className="h-2.5 w-2.5 text-white ml-0.5" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[9px] font-medium tracking-[0.15em] uppercase text-muted-foreground">
          {story.category || t("common.lifestyle")}
        </span>
        {story.posted_at && (
          <span className="text-[9px] text-muted-foreground/60">
            {new Date(story.posted_at).toLocaleDateString(locale, { month: "short", year: "numeric" })}
          </span>
        )}
      </div>
      <h3 className="font-display text-xs font-medium text-foreground line-clamp-2 leading-snug">
        {story.ai_title || t("common.untitled")}
      </h3>
    </Link>
  );
};

export default StoryPage;
