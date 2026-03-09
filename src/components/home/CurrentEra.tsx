import { useEffect, useState, useRef } from "react";
import { fetchReleases, type YouTubeRelease } from "@/lib/youtube";
import { fetchAllStreamingLinks, PLATFORM_INFO, type StreamingLink } from "@/lib/streaming";
import { Heart, List, Play, Pause, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export const CurrentEra = () => {
  const [releases, setReleases] = useState<YouTubeRelease[]>([]);
  const [streamingLinks, setStreamingLinks] = useState<Record<string, StreamingLink[]>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetchReleases().then((all) => {
      const singles = all.filter((r) => (r.track_count ?? 0) <= 1);
      const top5 = singles.slice(0, 5);
      setReleases(top5);
      // Fetch streaming links for these releases
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

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const goTo = (dir: -1 | 1) => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime("0:00");
    setActiveIndex((prev) => {
      const next = prev + dir;
      if (next < 0) return releases.length - 1;
      if (next >= releases.length) return 0;
      return next;
    });
  };

  // Fallback platform links from the release itself
  const platformLinks = links.length > 0
    ? links
    : [
        { platform: "apple_music", url: "https://music.apple.com/artist/cola-b/1663793217", release_id: current.id, id: "am", created_at: "" },
        { platform: "spotify", url: "https://open.spotify.com/artist/00rDJJmfKiMqxsGOuJmlzz", release_id: current.id, id: "sp", created_at: "" },
      ];

  return (
    <section className="relative overflow-hidden">
      {/* Dark immersive background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, hsl(260 25% 18%) 0%, hsl(250 20% 12%) 50%, hsl(240 15% 10%) 100%)",
        }}
      />

      {/* Particle shimmer trails */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              background: `hsl(${[190, 260, 35][i % 3]} ${60 + Math.random() * 30}% ${70 + Math.random() * 20}%)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${4 + Math.random() * 4}s ease-in-out ${Math.random() * 3}s infinite`,
            }}
          />
        ))}
        {/* Audio visualizer bars */}
        <div className="absolute top-8 right-8 flex items-end gap-[2px] opacity-20">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="w-[2px] bg-white/50 rounded-full"
              style={{
                height: `${10 + Math.sin(i * 0.5) * 20 + Math.random() * 15}px`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Background artwork fade */}
      {decodedThumb && (
        <div className="absolute right-0 top-0 bottom-0 w-[45%] hidden lg:block">
          <img
            src={decodedThumb}
            alt={current.title}
            className="h-full w-full object-cover opacity-30"
            style={{
              maskImage: "linear-gradient(to left, black 20%, transparent 80%)",
              WebkitMaskImage: "linear-gradient(to left, black 20%, transparent 80%)",
            }}
          />
        </div>
      )}

      <div className="relative container mx-auto px-6 py-16 md:py-24 z-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-white/60">
            Latest Releases
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goTo(-1)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            <span className="text-xs text-white/50 font-mono">
              {activeIndex + 1} / {releases.length}
            </span>
            <button
              onClick={() => goTo(1)}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        <Link to={`/release/${current.id}`} className="hover:opacity-90 transition-opacity">
          <h2 className="text-display-md font-display font-bold text-white mb-2">
            {current.title}
          </h2>
        </Link>
        <p className="text-lg font-medium text-white/80 mb-8">
          {current.year ? `${current.year}` : "Out Now"}
          {current.track_count && current.track_count > 1 ? ` · ${current.track_count} tracks` : ""}
        </p>

        {/* Functional YouTube Player */}
        {videoId && (
          <div className="mb-8 max-w-2xl">
            {isPlaying ? (
              <div className="relative rounded-xl overflow-hidden aspect-video shadow-2xl">
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title={current.title}
                />
                <button
                  onClick={handlePause}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
                >
                  <Pause className="h-4 w-4 text-white" />
                </button>
              </div>
            ) : (
              <div
                className="glass-dark rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.08] transition-colors"
                onClick={handlePlay}
              >
                {decodedThumb && (
                  <img src={decodedThumb} alt={current.title} className="w-14 h-14 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white truncate">
                      {current.title} — Cola B
                    </p>
                    <Heart className="h-3.5 w-3.5 text-white/50 flex-shrink-0" />
                    <List className="h-3.5 w-3.5 text-white/50 flex-shrink-0" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-white" />
                    <span className="text-[10px] text-white/50">0:00</span>
                    <div className="flex-1 h-[2px] bg-white/20 rounded-full" />
                    <MoreHorizontal className="h-3.5 w-3.5 text-white/40" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mini player for non-video (audio-only) fallback */}
        {!videoId && (
          <div className="glass-dark rounded-xl p-4 max-w-sm mb-8 flex items-center gap-4">
            {decodedThumb && (
              <img src={decodedThumb} alt={current.title} className="w-14 h-14 rounded-lg object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-white truncate">
                  {current.title} — Cola B
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-white" />
                <span className="text-[10px] text-white/50">0:00</span>
                <div className="flex-1 h-[2px] bg-white/20 rounded-full" />
              </div>
            </div>
          </div>
        )}

        {/* Streaming buttons */}
        <div className="flex flex-wrap gap-3 mb-10">
          {platformLinks.map((link) => {
            const info = PLATFORM_INFO[link.platform];
            if (!info) return null;
            return (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase text-white/90 transition-all hover:scale-105"
                style={{ background: "hsl(0 0% 100% / 0.12)", backdropFilter: "blur(10px)" }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d={info.icon} />
                </svg>
                {info.label}
              </a>
            );
          })}
          <Link
            to={`/release/${current.id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase text-white/90 transition-all hover:scale-105 border border-white/20"
          >
            View All Links →
          </Link>
        </div>

        {/* Release thumbnails strip */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {releases.map((r, i) => {
            const thumb = r.thumbnail_url?.replace(/&amp;/g, "&");
            return (
              <button
                key={r.id}
                onClick={() => {
                  setActiveIndex(i);
                  setIsPlaying(false);
                }}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  i === activeIndex
                    ? "border-white/80 scale-110"
                    : "border-white/10 opacity-60 hover:opacity-90"
                }`}
              >
                {thumb ? (
                  <img src={thumb} alt={r.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/40 text-xs">
                    ♪
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Star decoration */}
      <svg
        className="absolute right-12 top-12 w-5 h-5 text-white/20 animate-pulse-glow"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
      </svg>
    </section>
  );
};
