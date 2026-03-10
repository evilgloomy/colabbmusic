import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, MapPin, Calendar } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { supabase } from "@/integrations/supabase/client";

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

const DEFAULT_TITLE = "Cola B — Official Site";
const DEFAULT_DESCRIPTION = "Music, cities, moments, and everything in between.";

function useSEO(story: Story | null) {
  useEffect(() => {
    if (!story) return;

    const title = `${story.ai_title || "Story"} — Cola B`;
    const description = story.ai_enhanced_text || DEFAULT_DESCRIPTION;
    const image = story.media_url || "";
    const url = window.location.href;

    document.title = title;

    const metas: Record<string, string> = {
      "og:title": title,
      "og:description": description,
      "og:image": image,
      "og:url": url,
      "og:type": "article",
      "twitter:card": "summary_large_image",
      "twitter:title": title,
      "twitter:description": description,
      "twitter:image": image,
    };

    const cleanup: (() => void)[] = [];

    Object.entries(metas).forEach(([property, content]) => {
      if (!content) return;
      const attr = property.startsWith("twitter:") ? "name" : "property";
      let el = document.querySelector(`meta[${attr}="${property}"]`) as HTMLMetaElement | null;
      const existed = !!el;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, property);
        document.head.appendChild(el);
      }
      const prev = el.getAttribute("content");
      el.setAttribute("content", content);
      cleanup.push(() => {
        if (!existed) {
          el!.remove();
        } else if (prev) {
          el!.setAttribute("content", prev);
        }
      });
    });

    return () => {
      document.title = DEFAULT_TITLE;
      cleanup.forEach((fn) => fn());
    };
  }, [story]);
}

const StoryDetailPage = () => {
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

  useSEO(story);

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
          <h1 className="text-display-md font-display font-bold text-foreground mb-4">Story not found</h1>
          <Link to="/story" className="text-primary hover:underline text-sm">
            ← Back to all stories
          </Link>
        </div>
      </PageLayout>
    );
  }

  const isVideo = story.media_type === "VIDEO";
  const formattedDate = story.posted_at
    ? new Date(story.posted_at).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <PageLayout>
      <article className="container mx-auto px-6 py-24 md:py-32">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link
            to="/story"
            className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Stories
          </Link>

          {/* Category + meta */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="px-3 py-1 text-[10px] font-bold tracking-[0.2em] uppercase bg-secondary text-secondary-foreground rounded-sm">
              {story.category || "lifestyle"}
            </span>
            {story.location && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {story.location}
              </span>
            )}
            {formattedDate && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-display-md font-display font-bold text-foreground mb-8">
            {story.ai_title || "Untitled"}
          </h1>

          {/* Media */}
          {story.media_url && (
            <div className="rounded-xl overflow-hidden mb-10">
              {isVideo ? (
                <video
                  src={story.media_url}
                  controls
                  playsInline
                  className="w-full rounded-xl"
                  poster={story.media_url}
                />
              ) : (
                <img
                  src={story.media_url}
                  alt={story.ai_title || "Cola B story"}
                  className="w-full h-auto rounded-xl"
                  loading="eager"
                />
              )}
            </div>
          )}

          {/* Enhanced text */}
          {story.ai_enhanced_text && (
            <p className="text-lg md:text-xl leading-relaxed text-foreground mb-8">
              {story.ai_enhanced_text}
            </p>
          )}

          {/* Original text */}
          {story.original_text && story.original_text !== story.ai_enhanced_text && (
            <blockquote className="border-l-2 border-primary/40 pl-5 py-1 text-muted-foreground italic text-sm leading-relaxed mb-10">
              {story.original_text}
            </blockquote>
          )}

          {/* Threads link */}
          {story.permalink && (
            <a
              href={story.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wider uppercase text-muted-foreground hover:text-primary transition-colors"
            >
              View on Threads <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </article>
    </PageLayout>
  );
};

export default StoryDetailPage;
