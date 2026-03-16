import { PageLayout } from "@/components/layout/PageLayout";
import { Play, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { fetchYouTubeFeed, CHANNELS, type YouTubeVideo } from "@/lib/youtube";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from "react-i18next";
import bannerVideos from "@/assets/banner-videos.jpg";

const VideosPage = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("zh") ? "zh-HK" : "en-US";

  useSEO({
    title: t("videos.pageTitle") + " — Cola B",
    description: t("videos.pageDesc"),
  });

  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchYouTubeFeed(CHANNELS.VEVO, 15)
      .then(setVideos)
      .finally(() => setLoading(false));
  }, []);

  const featured = videos[featuredIndex];
  const rest = videos.filter((_, i) => i !== featuredIndex);

  const handleSelectVideo = (video: YouTubeVideo) => {
    const idx = videos.findIndex((v) => v.videoId === video.videoId);
    setFeaturedIndex(idx);
    setPlayingId(video.videoId);
    heroRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <PageLayout>
      <section className="relative overflow-hidden">
        <img src={bannerVideos} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/40" />
        <div className="relative container mx-auto px-6 py-32 md:py-40">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-4">{t("videos.visual")}</p>
          <h1 className="text-display-lg font-display font-bold text-foreground mb-6">{t("videos.pageTitle")}</h1>
          <p className="text-muted-foreground max-w-lg">{t("videos.pageDesc")}</p>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : videos.length === 0 ? (
        <div className="container mx-auto px-6 py-20 text-center"><p className="text-muted-foreground">{t("videos.noVideos")}</p></div>
      ) : (
        <>
          {featured && (
            <section ref={heroRef} className="container mx-auto px-6 pb-16">
              <div className="relative aspect-video overflow-hidden rounded-lg glass">
                {playingId === featured.videoId ? (
                  <iframe src={`${featured.embedUrl}?autoplay=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={featured.title} />
                ) : (
                  <button onClick={() => setPlayingId(featured.videoId)} className="w-full h-full relative group cursor-pointer">
                    <img src={featured.thumbnail} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/10 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-primary/80 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all">
                        <Play className="h-8 w-8 text-primary-foreground ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-primary-foreground/80 mb-1">{t("videos.latest")}</p>
                      <h3 className="font-display text-lg md:text-xl font-medium text-primary-foreground">{featured.title}</h3>
                    </div>
                  </button>
                )}
              </div>
            </section>
          )}

          {rest.length > 0 && (
            <section className="container mx-auto px-6 pb-24">
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-8">{t("videos.allVideos")}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rest.map((video) => (
                  <div key={video.videoId} className="group">
                    <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
                      <button onClick={() => handleSelectVideo(video)} className="w-full h-full relative cursor-pointer">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-foreground/15 group-hover:bg-foreground/5 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-primary/70 flex items-center justify-center group-hover:bg-primary transition-colors">
                            <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                          </div>
                        </div>
                      </button>
                    </div>
                    <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">
                      {new Date(video.published).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                    <h3 className="font-display text-sm font-medium text-foreground">{video.title}</h3>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </PageLayout>
  );
};

export default VideosPage;
