import { Play, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchYouTubeFeed, CHANNELS, type YouTubeVideo } from "@/lib/youtube";

export const FeaturedVideo = () => {
  const [video, setVideo] = useState<YouTubeVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    fetchYouTubeFeed(CHANNELS.VEVO, 1)
      .then((videos) => setVideo(videos[0] || null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="bg-deep">
        <div className="container mx-auto px-6 py-24 md:py-32 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (!video) return null;

  return (
    <section className="bg-deep">
      <div className="container mx-auto px-6 py-24 md:py-32">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-3">Watch</p>
            <h2 className="text-display-md font-display font-bold text-foreground">Featured Video</h2>
          </div>
        </div>

        <div className="relative aspect-video overflow-hidden bg-card">
          {playing ? (
            <iframe
              src={`${video.embedUrl}?autoplay=1`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={video.title}
            />
          ) : (
            <button
              onClick={() => setPlaying(true)}
              className="w-full h-full relative group cursor-pointer"
            >
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-background/30 group-hover:bg-background/20 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border-2 border-foreground/60 flex items-center justify-center group-hover:border-primary group-hover:scale-110 transition-all">
                  <Play className="h-8 w-8 text-foreground ml-1" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="font-display text-lg md:text-xl font-medium text-foreground">{video.title}</h3>
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
