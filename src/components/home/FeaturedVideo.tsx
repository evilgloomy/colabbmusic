import { Play, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { fetchYouTubeFeed, CHANNELS, type YouTubeVideo } from "@/lib/youtube";
import { useTranslation } from "react-i18next";

export const FeaturedVideo = () => {
  const { t } = useTranslation();
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
      <section>
        <div className="editorial py-24 md:py-32 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  if (!video) return null;

  return (
    <section className="border-t border-border/40">
      <div className="editorial py-24 md:py-32">
        <div className="mb-12">
          <p className="text-xs font-body font-medium tracking-[0.3em] uppercase text-muted-foreground mb-3">{t("home.watch")}</p>
          <h2 className="text-display-md font-display font-semibold text-foreground">{t("home.featuredVideo")}</h2>
        </div>

        <div className="relative aspect-video overflow-hidden bg-muted">
          {playing ? (
            <iframe
              src={`${video.embedUrl}?autoplay=1`}
              className="w-full h-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title={video.title}
            />
          ) : (
            <button onClick={() => setPlaying(true)} className="w-full h-full relative group cursor-pointer">
              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
              <div className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/10 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full border border-white/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Play className="h-8 w-8 text-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="font-display text-lg md:text-xl text-white">{video.title}</h3>
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
