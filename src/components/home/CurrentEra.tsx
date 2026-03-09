import { useEffect, useState } from "react";
import { fetchReleases, type YouTubeRelease } from "@/lib/youtube";
import { Heart, List, Play, Pause, MoreHorizontal } from "lucide-react";

export const CurrentEra = () => {
  const [latest, setLatest] = useState<YouTubeRelease | null>(null);

  useEffect(() => {
    fetchReleases().then((releases) => {
      if (releases.length > 0) setLatest(releases[0]);
    });
  }, []);

  if (!latest) return null;

  const decodedThumb = latest.thumbnail_url?.replace(/&amp;/g, "&");

  return (
    <section className="relative overflow-hidden">
      {/* City skyline / dark immersive background */}
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
        {/* Audio visualizer bars — decorative */}
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

      {/* Blonde model portrait — right side */}
      {decodedThumb && (
        <div className="absolute right-0 top-0 bottom-0 w-[45%] hidden lg:block">
          <img
            src={decodedThumb}
            alt={latest.title}
            className="h-full w-full object-cover opacity-40"
            style={{
              maskImage: "linear-gradient(to left, black 20%, transparent 80%)",
              WebkitMaskImage: "linear-gradient(to left, black 20%, transparent 80%)",
            }}
          />
        </div>
      )}

      <div className="relative container mx-auto px-6 py-20 md:py-28 z-10">
        <p className="text-xs font-semibold tracking-[0.3em] uppercase text-white/60 mb-6">
          Latest Release
        </p>

        <h2 className="text-display-md font-display font-bold text-white mb-2">
          New Single: "{latest.title}"
        </h2>
        <p className="text-lg font-medium text-white/80 mb-10">Out Now</p>

        {/* Mini player widget */}
        <div className="glass-dark rounded-xl p-4 max-w-sm mb-8 flex items-center gap-4">
          {decodedThumb && (
            <img src={decodedThumb} alt={latest.title} className="w-14 h-14 rounded-lg object-cover" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-white truncate">
                {latest.title} - Cola B
              </p>
              <Heart className="h-3.5 w-3.5 text-white/50 flex-shrink-0" />
              <List className="h-3.5 w-3.5 text-white/50 flex-shrink-0" />
            </div>
            <div className="flex items-center gap-2">
              <Pause className="h-4 w-4 text-white" />
              <span className="text-[10px] text-white/50">0:01</span>
              <div className="flex-1 h-[2px] bg-white/20 rounded-full relative">
                <div className="absolute left-0 top-0 h-full w-[5%] bg-white rounded-full" />
              </div>
              <MoreHorizontal className="h-3.5 w-3.5 text-white/40" />
            </div>
          </div>
        </div>

        {/* Streaming buttons */}
        <div className="flex flex-wrap gap-3">
          <a
            href="https://music.apple.com/artist/cola-b/1663793217"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase text-white/90 transition-all hover:scale-105"
            style={{ background: "hsl(0 0% 100% / 0.12)", backdropFilter: "blur(10px)" }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.802.42.127.856.187 1.297.228.592.054 1.185.063 1.778.064h12.383a10.13 10.13 0 001.15-.063 5.825 5.825 0 001.597-.394c1.404-.6 2.378-1.62 2.907-3.06.177-.483.27-.985.335-1.492.073-.585.1-1.175.1-1.764V6.123h.004zm-6.77 5.04c-.003 2.09-.012 4.18.003 6.27a3.27 3.27 0 01-.247 1.312 2.61 2.61 0 01-1.395 1.4c-.39.164-.807.25-1.23.283-.67.056-1.34.028-1.975-.234a2.18 2.18 0 01-1.323-1.597 2.206 2.206 0 011.098-2.403c.404-.234.847-.375 1.3-.46.547-.1 1.1-.162 1.64-.28.367-.082.59-.323.652-.7.015-.072.022-.15.022-.224.002-1.81 0-3.62 0-5.43v-.18l-5.67 1.247v.066c.002 2.63 0 5.26.005 7.89 0 .31-.03.617-.112.916a2.557 2.557 0 01-1.17 1.6c-.44.27-.924.408-1.424.472-.527.068-1.057.05-1.57-.107a2.21 2.21 0 01-1.527-1.79 2.202 2.202 0 011.37-2.406c.357-.154.733-.27 1.11-.36.496-.114.997-.2 1.49-.322.416-.1.636-.396.67-.82.003-.034.004-.07.004-.103V7.27a1.1 1.1 0 01.852-1.09c.21-.06.42-.107.633-.15l4.233-.89c.695-.146 1.39-.29 2.086-.437.192-.04.386-.07.58-.088.345-.03.594.17.623.52.004.042.004.085.004.127v5.95l-.006-.006z"/></svg>
            Stream on Apple Music
          </a>
          <a
            href="https://open.spotify.com/artist/00rDJJmfKiMqxsGOuJmlzz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase text-white/90 transition-all hover:scale-105"
            style={{ background: "hsl(0 0% 100% / 0.12)", backdropFilter: "blur(10px)" }}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
            Stream on Spotify
          </a>
        </div>
      </div>

      {/* Star decoration */}
      <svg className="absolute right-12 top-12 w-5 h-5 text-white/20 animate-pulse-glow" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
      </svg>
    </section>
  );
};
