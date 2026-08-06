import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { fetchYouTubeFeed, CHANNELS, type YouTubeVideo } from "@/lib/youtube";
import { Reveal, Kicker } from "@/components/editorial/Reveal";
import { publishableOnly, isPublishableVideo } from "@/lib/publishable";
import { trackVideoPlay } from "@/lib/analytics";

export const VideoFilm = () => {
  const { t } = useTranslation();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    fetchYouTubeFeed(CHANNELS.VEVO, 6).then((all) =>
      setVideos(publishableOnly(all, isPublishableVideo, "home/videos").slice(0, 4)),
    );
  }, []);

  if (videos.length === 0) return null;
  const [lead, ...rest] = videos;

  return (
    <section className="bg-cola-surface band">
      <div className="editorial">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Kicker>{t("hp.videosLabel")}</Kicker>
            <h2 className="font-display text-section mt-4">{t("hp.videosTitle")}</h2>
          </div>
          <Link to="/videos" className="label text-cola-pearl/60 hover:text-cola-pink transition-colors">
            {t("hp.videosAll")} →
          </Link>
        </Reveal>

        <Reveal delay={100} className="mt-12">
          <div className="relative aspect-video overflow-hidden bg-cola-ink">
            {playing ? (
              <iframe
                src={`${lead.embedUrl}?autoplay=1`}
                className="h-full w-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={lead.title}
              />
            ) : (
              <button
                onClick={() => {
                  setPlaying(true);
                  trackVideoPlay(lead.videoId, lead.title, "home_video");
                }} className="group h-full w-full relative">
                <img
                  src={lead.thumbnail}
                  alt={lead.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-cola-ink/35 group-hover:bg-cola-ink/20 transition-colors" />
                <div className="absolute inset-0 grid place-items-center">
                  <span className="h-20 w-20 rounded-full border border-cola-pearl/60 grid place-items-center transition-transform duration-300 group-hover:scale-110">
                    <Play className="h-7 w-7 text-cola-pearl ml-1" />
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6 text-left">
                  <h3 className="font-display text-display-md text-cola-pearl">{lead.title}</h3>
                </div>
              </button>
            )}
          </div>
        </Reveal>

        {rest.length > 0 && (
          <div className="mt-10 grid grid-cols-3 gap-6">
            {rest.slice(0, 3).map((v, i) => (
              <Reveal key={v.videoId} delay={i * 70}>
                <Link to="/videos" className="group block">
                  <div className="aspect-video overflow-hidden bg-cola-ink">
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      loading="lazy"
                      className="h-full w-full object-cover opacity-80 transition-all duration-700 group-hover:opacity-100 group-hover:scale-[1.04]"
                    />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-1 group-hover:text-foreground transition-colors">
                    {v.title}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
