import { useEffect, useState, useRef } from "react";
import { fetchReleases, type YouTubeRelease } from "@/lib/youtube";
import { fetchAllStreamingLinks, PLATFORM_INFO, type StreamingLink } from "@/lib/streaming";
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const CurrentEra = () => {
  const { t } = useTranslation();
  const [releases, setReleases] = useState<YouTubeRelease[]>([]);
  const [streamingLinks, setStreamingLinks] = useState<Record<string, StreamingLink[]>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetchReleases().then((all) => {
      const singles = all.filter((r) => (r.track_count ?? 0) <= 1);
      const top5 = singles.slice(0, 5);
      setReleases(top5);
      if (top5.length > 0) {
        fetchAllStreamingLinks(top5.map((r) => r.id)).then(setStreamingLinks);
      }
    });
  }, []);

  if (releases.length === 0) return null;

  const current = releases[activeIndex];
  const decodedThumb = current.thumbnail_url?.replace(/&amp;/g, "&");
  const links = streamingLinks[current.id] || [];
  const videoId = current.video_id;

  const goTo = (dir: -1 | 1) => {
    setIsPlaying(false);
    setActiveIndex((prev) => {
      const next = prev + dir;
      if (next < 0) return releases.length - 1;
      if (next >= releases.length) return 0;
      return next;
    });
  };

  const platformLinks = links.length > 0
    ? links
    : [
        { platform: "apple_music", url: "https://music.apple.com/artist/cola-b/1663793217", release_id: current.id, id: "am", created_at: "" },
        { platform: "spotify", url: "https://open.spotify.com/artist/3LrZ1mrMzMFm5forQrdBVn", release_id: current.id, id: "sp", created_at: "" },
      ];

  return (
    <section className="relative overflow-hidden" style={{ background: "hsl(20 8% 10%)" }}>
      {/* Subtle cover bleed on desktop */}
      {decodedThumb && (
        <div className="absolute right-0 top-0 bottom-0 w-[45%] hidden lg:block">
          <img
            src={decodedThumb}
            alt={current.title}
            className="h-full w-full object-cover opacity-20"
            style={{
              maskImage: "linear-gradient(to left, black 10%, transparent 70%)",
              WebkitMaskImage: "linear-gradient(to left, black 10%, transparent 70%)",
            }}
          />
        </div>
      )}

      <div className="relative editorial py-20 md:py-28 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-xs font-body font-semibold tracking-[0.3em] uppercase text-white/50">
            {t("home.latestReleases")}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => goTo(-1)} className="w-8 h-8 rounded-full border border-white/15 hover:border-white/30 flex items-center justify-center transition-colors">
              <ChevronLeft className="h-4 w-4 text-white/70" />
            </button>
            <span className="text-xs text-white/70 font-body tabular-nums">{activeIndex + 1} / {releases.length}</span>
            <button onClick={() => goTo(1)} className="w-8 h-8 rounded-full border border-white/15 hover:border-white/30 flex items-center justify-center transition-colors">
              <ChevronRight className="h-4 w-4 text-white/70" />
            </button>
          </div>
        </div>

        {/* Title */}
        <Link to={`/release/${current.id}`} className="hover:opacity-80 transition-opacity">
          <h2 className="text-display-lg font-display font-bold text-white mb-3">{current.title}</h2>
        </Link>
        <p className="text-base font-body text-white/60 mb-10">
          {current.year || t("home.outNow")}
          {current.track_count && current.track_count > 1 ? ` · ${current.track_count} ${t("home.tracks")}` : ""}
        </p>

        {/* Player */}
        {videoId && (
          <div className="mb-10 max-w-2xl">
            {isPlaying ? (
              <div className="relative aspect-video overflow-hidden shadow-2xl">
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title={current.title}
                />
                <button onClick={() => setIsPlaying(false)} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors">
                  <Pause className="h-4 w-4 text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsPlaying(true)}
                className="flex items-center gap-4 p-4 bg-white/[0.06] hover:bg-white/[0.1] transition-colors w-full text-left group"
              >
                {decodedThumb && <img src={decodedThumb} alt={current.title} className="w-14 h-14 object-cover flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-white truncate">{current.title} — Cola B</p>
                  <p className="text-xs text-white/70 mt-0.5">{t("hero.listenNow")}</p>
                </div>
                <Play className="h-5 w-5 text-white/60 group-hover:text-white transition-colors flex-shrink-0" />
              </button>
            )}
          </div>
        )}

        {/* Streaming links */}
        <div className="flex flex-wrap gap-3 mb-10">
          {platformLinks.map((link) => {
            const info = PLATFORM_INFO[link.platform];
            if (!info) return null;
            return (
              <a key={link.platform} href={link.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-body font-semibold tracking-wider uppercase text-white/80 border border-white/10 hover:border-white/25 transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d={info.icon} /></svg>
                {info.label}
              </a>
            );
          })}
          <Link to={`/release/${current.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-body font-semibold tracking-wider uppercase text-white/80 border border-white/10 hover:border-white/25 transition-colors">
            {t("home.viewAllLinks")}
          </Link>
        </div>

        {/* Thumbnails */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {releases.map((r, i) => {
            const thumb = r.thumbnail_url?.replace(/&amp;/g, "&");
            return (
              <button key={r.id} onClick={() => { setActiveIndex(i); setIsPlaying(false); }}
                className={`flex-shrink-0 w-14 h-14 overflow-hidden transition-all ${
                  i === activeIndex ? "ring-2 ring-white/60 scale-110" : "opacity-50 hover:opacity-80"
                }`}>
                {thumb ? (
                  <img src={thumb} alt={r.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/70 text-xs">♪</div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
