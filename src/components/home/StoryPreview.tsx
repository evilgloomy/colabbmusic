import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Play, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchYouTubeFeed, CHANNELS, type YouTubeVideo } from "@/lib/youtube";

const SHOPIFY_STORE_URL = "https://www.colabbshop.com";

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
  const [latestVideo, setLatestVideo] = useState<YouTubeVideo | null>(null);
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    fetchYouTubeFeed(CHANNELS.VEVO, 1).then((vids) => setLatestVideo(vids[0] || null));

    const fetchStories = async () => {
      const { data } = await supabase
        .from("stories")
        .select("id, ai_title, ai_enhanced_text, category, media_url, media_type, posted_at")
        .order("posted_at", { ascending: false })
        .limit(3);

      if (data) setStories(data);
    };
    fetchStories();
  }, []);

  return (
    <section className="bg-background">
      <div className="container mx-auto px-6 py-20 md:py-28">
        <h2 className="text-display-md font-display font-bold text-foreground mb-10">
          Inside Cola's World
        </h2>

        {/* Two-column grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* LATEST STORIES from Threads */}
          <div className="rounded-xl overflow-hidden bg-card border border-border/50">
            <div className="p-5 pb-3 flex items-center justify-between">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">
                From Her World
              </p>
              <Link to="/story" className="text-xs text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="px-5 pb-5 space-y-4">
              {stories.length > 0 ? (
              stories.map((story) => (
                  <Link key={story.id} to={`/story/${story.id}`} className="group flex gap-3 hover:bg-muted/50 rounded-lg p-1 -m-1 transition-colors">
                    {story.media_url && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted relative">
                        {story.media_type === "VIDEO" ? (
                          <video
                            src={story.media_url!}
                            className="w-full h-full object-cover"
                            muted
                            autoPlay
                            loop
                            playsInline
                            preload="auto"
                          />
                        ) : (
                          <img
                            src={story.media_url!}
                            alt={story.ai_title || "Story"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        )}
                        {story.media_type === "VIDEO" && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Play className="h-3 w-3 text-white drop-shadow" />
                          </div>
                        )}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-muted-foreground mb-0.5">
                        {story.category || "lifestyle"}
                      </p>
                      <p className="text-sm font-semibold text-foreground truncate">
                        {story.ai_title || "Untitled"}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {story.ai_enhanced_text || ""}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-xs text-muted-foreground">Stories coming soon</p>
                </div>
              )}
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
