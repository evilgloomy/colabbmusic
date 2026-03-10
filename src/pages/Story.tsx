import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { supabase } from "@/integrations/supabase/client";
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

const categories = [
  "all", "music", "travel", "fashion", "events", "studio", "lifestyle", "humor",
] as const;

const StoryPage = () => {
  const [filter, setFilter] = useState<string>("all");
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("id, ai_title, ai_enhanced_text, category, media_url, media_type, permalink, posted_at, location, featured")
        .order("posted_at", { ascending: false });

      if (!error && data) {
        setStories(data);
      }
      setLoading(false);
    };
    fetchStories();
  }, []);

  const withMedia = stories.filter((s) => s.media_url);
  const filtered = filter === "all"
    ? withMedia
    : withMedia.filter((s) => s.category === filter);

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src={bannerStory} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/40" />
        <div className="relative container mx-auto px-6 py-32 md:py-40">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-4">Her World</p>
          <h1 className="text-display-lg font-display font-bold text-foreground mb-6">Story</h1>
          <p className="text-muted-foreground max-w-lg">
            Music, cities, moments, and everything in between. A living archive of Cola B's world.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <section className="border-y border-border/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 text-xs font-medium tracking-wider uppercase rounded-sm transition-colors ${
                  filter === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-blush/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Story grid */}
      <section className="container mx-auto px-6 py-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`${i === 0 ? "md:col-span-2 md:row-span-2" : ""}`}>
                <div className={`rounded-lg bg-muted animate-pulse ${i === 0 ? "aspect-[4/3]" : "aspect-square"}`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filtered.map((story, i) => (
              <StoryCard key={story.id} story={story} size={i % 5 === 0 ? "large" : "normal"} />
            ))}
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-muted-foreground text-center py-20">
            {stories.length === 0
              ? "Stories from Threads will appear here once synced."
              : "No stories in this category yet."}
          </p>
        )}
      </section>
    </PageLayout>
  );
};

const StoryCard = ({ story, size }: { story: Story; size: "large" | "normal" }) => {
  const isLarge = size === "large";

  return (
    <Link
      to={`/story/${story.id}`}
      className={`group block ${isLarge ? "md:col-span-2 md:row-span-2" : ""}`}
    >
      <div className={`relative overflow-hidden rounded-lg ${isLarge ? "aspect-[4/3]" : "aspect-square"}`}>
        {story.media_url ? (
          story.media_type === "VIDEO" ? (
            <video
              src={story.media_url}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
            />
          ) : (
            <img
              src={story.media_url}
              alt={story.ai_title || "Cola B story"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
          )
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary via-muted to-accent/30 flex items-center justify-center p-6">
            <p className="text-foreground/60 text-center text-sm font-display italic line-clamp-4">
              {story.ai_enhanced_text || story.ai_title || ""}
            </p>
          </div>
        )}
        {story.media_type === "VIDEO" && story.media_url && (
          <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-foreground/40 backdrop-blur-sm flex items-center justify-center">
            <Play className="h-4 w-4 text-white ml-0.5" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-accent-foreground/80">
              {story.category || "lifestyle"}
            </span>
            {story.location && (
              <span className="text-[10px] text-accent-foreground/60">· {story.location}</span>
            )}
          </div>
          <h3 className={`font-display font-medium text-accent-foreground ${isLarge ? "text-lg md:text-xl" : "text-sm"}`}>
            {story.ai_title || "Untitled"}
          </h3>
          <p className={`text-accent-foreground/70 mt-1 ${isLarge ? "text-sm" : "text-xs"} line-clamp-2`}>
            {story.ai_enhanced_text || ""}
          </p>
          {story.posted_at && (
            <p className="text-[10px] text-accent-foreground/40 mt-2">
              {new Date(story.posted_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default StoryPage;
