import { PageLayout } from "@/components/layout/PageLayout";
import { Play, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { fetchYouTubeFeed, CHANNELS, type YouTubeVideo } from "@/lib/youtube";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from "react-i18next";
import bannerVideos from "@/assets/banner-videos.jpg";
import { publishableOnly, isPublishableVideo } from "@/lib/publishable";
import { trackVideoPlay } from "@/lib/analytics";

const VideosPage = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("zh") ? "zh-HK" : "en-US";

  useSEO({
    title: t("videos.pageTitle") + " — Cola B",
    description:
      "Watch every official Cola B music video and visual release from her VEVO channel — full-length premieres, live sessions, and behind-the-scenes cuts.",
  });

  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchYouTubeFeed(CHANNELS.VEVO, 15)
      .then((all) => setVideos(publishableOnly(all, isPublishableVideo, "videos page")))
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
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src={bannerVideos} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/50 to-background" />
        <div className="relative editorial py-32 md:py-44">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-4">{t("videos.visual")}</p>
          <h1 className="text-display-lg font-display font-bold text-foreground mb-4">{t("videos.pageTitle")}</h1>
          <p className="text-muted-foreground max-w-md text-sm">{t("videos.pageDesc")}</p>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : videos.length === 0 ? (
        <div className="editorial py-20 text-center"><p className="text-muted-foreground">{t("videos.noVideos")}</p></div>
      ) : (
        <>
          {featured && (
            <section ref={heroRef} className="editorial pb-16">
              <div className="relative aspect-video overflow-hidden bg-card">
                {playingId === featured.videoId ? (
                  <iframe src={`${featured.embedUrl}?autoplay=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={featured.title} />
                ) : (
                  <button onClick={() => { setPlayingId(featured.videoId); trackVideoPlay(featured.videoId, featured.title, "videos_page"); }} className="w-full h-full relative group cursor-pointer">
                    <img src={featured.thumbnail} alt={featured.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" />
                    <div className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/10 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/80 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all">
                        <Play className="h-7 w-7 md:h-8 md:w-8 text-primary-foreground ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-white/70 mb-1">{t("videos.latest")}</p>
                      <h3 className="font-display text-base md:text-lg font-medium text-white">{featured.title}</h3>
                    </div>
                  </button>
                )}
              </div>
            </section>
          )}

          {rest.length > 0 && (
            <section className="editorial pb-24">
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-8">{t("videos.allVideos")}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                {rest.map((video) => (
                  <div key={video.videoId} className="group">
                    <div className="relative aspect-video overflow-hidden mb-3 bg-card">
                      <button onClick={() => handleSelectVideo(video)} className="w-full h-full relative cursor-pointer">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                        <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/0 transition-colors" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 bg-primary/80 flex items-center justify-center">
                            <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                          </div>
                        </div>
                      </button>
                    </div>
                    <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1">
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
