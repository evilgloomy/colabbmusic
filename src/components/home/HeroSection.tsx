import { Link } from "react-router-dom";
import { Play, Video, Music, X } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import heroImage from "@/assets/hero-cola-b.png";
import { fetchReleases, type YouTubeRelease } from "@/lib/youtube";

/* ─── SVG Musical Notes Background ─── */
const MusicalOverlay = () => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none"
    viewBox="0 0 1200 700"
    fill="none"
    preserveAspectRatio="xMidYMid slice"
  >
    {/* Staves */}
    {[180, 320, 460].map((y) =>
      Array.from({ length: 5 }).map((_, i) => (
        <line
          key={`stave-${y}-${i}`}
          x1="0"
          y1={y + i * 8}
          x2="1200"
          y2={y + i * 8 + 30}
          stroke="white"
          strokeOpacity="0.06"
          strokeWidth="1"
        />
      ))
    )}
    {/* Treble clef */}
    <text x="80" y="250" fontSize="80" fill="white" fillOpacity="0.08" fontFamily="serif">
      𝄞
    </text>
    {/* Floating notes */}
    <text x="300" y="200" fontSize="32" fill="white" fillOpacity="0.1" fontFamily="serif">♪</text>
    <text x="550" y="350" fontSize="24" fill="white" fillOpacity="0.07" fontFamily="serif">♫</text>
    <text x="800" y="180" fontSize="28" fill="white" fillOpacity="0.09" fontFamily="serif">♩</text>
    <text x="950" y="400" fontSize="36" fill="white" fillOpacity="0.06" fontFamily="serif">♬</text>
    <text x="150" y="450" fontSize="20" fill="white" fillOpacity="0.08" fontFamily="serif">♪</text>
    <text x="700" y="550" fontSize="30" fill="white" fillOpacity="0.07" fontFamily="serif">𝄢</text>
  </svg>
);

/* ─── Audio Waveform Background ─── */
const WaveformBg = () => (
  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex items-center justify-center gap-[3px] opacity-[0.08] pointer-events-none px-12">
    {Array.from({ length: 80 }).map((_, i) => {
      const h = 12 + Math.sin(i * 0.3) * 30 + Math.cos(i * 0.7) * 20;
      return (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            height: `${h}px`,
            background: `linear-gradient(to top, hsl(340 30% 75%), hsl(260 40% 80%))`,
          }}
        />
      );
    })}
  </div>
);

/* ─── Glassmorphic Floating Player ─── */
const FloatingPlayer = () => (
  <motion.div
    className="absolute top-28 left-6 md:left-12 z-20 w-56 md:w-64"
    animate={{ y: [0, -8, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
  >
    <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center gap-3 mb-3">
        <img
          src={heroImage}
          alt="Cola B"
          className="w-9 h-9 rounded-lg object-cover object-top"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-foreground/90 truncate">Now Playing</p>
          <p className="text-[10px] text-muted-foreground truncate">Cola B — Latest Single</p>
        </div>
        <X className="w-3 h-3 text-muted-foreground/50 cursor-pointer hover:text-foreground transition-colors" />
      </div>
      {/* Waveform graphic */}
      <div className="flex items-end gap-[2px] h-6 mb-3">
        {Array.from({ length: 28 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-[3px] rounded-full"
            style={{
              background: `linear-gradient(to top, hsl(190 80% 65%), hsl(260 40% 75%))`,
            }}
            animate={{
              height: [
                `${6 + Math.sin(i * 0.5) * 8}px`,
                `${6 + Math.cos(i * 0.7) * 12}px`,
                `${6 + Math.sin(i * 0.5) * 8}px`,
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.05 }}
          />
        ))}
      </div>
      {/* Mini tracklist */}
      <div className="space-y-1.5">
        {["Midnight Bloom", "Golden Hours", "Pastel Dreams"].map((t, i) => (
          <div key={t} className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground/60 w-3">{i + 1}</span>
            <span className="text-[10px] text-foreground/70 truncate">{t}</span>
            <Music className="w-2.5 h-2.5 text-muted-foreground/40 ml-auto flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  </motion.div>
);

/* ─── Vinyl Record SVG ─── */
const VinylRecord = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    className={className}
    animate={{ y: [0, -10, 0] }}
    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay }}
  >
    <div className="animate-spin-slow">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="hsl(240 10% 12%)" stroke="hsl(0 0% 30%)" strokeWidth="1" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="hsl(0 0% 25%)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="hsl(0 0% 22%)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="22" fill="none" stroke="hsl(0 0% 25%)" strokeWidth="0.5" />
        <circle cx="50" cy="50" r="14" fill="hsl(260 40% 55%)" />
        <circle cx="50" cy="50" r="4" fill="hsl(0 0% 15%)" />
        {/* Groove shimmer */}
        <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(260 30% 50% / 0.2)" strokeWidth="6" strokeDasharray="2 4" />
      </svg>
    </div>
  </motion.div>
);

/* ─── Orbit Ring ─── */
const OrbitRing = ({
  color,
  size,
  duration,
  tilt,
}: {
  color: string;
  size: number;
  duration: number;
  tilt: string;
}) => (
  <motion.div
    className="absolute"
    style={{
      width: `${size}px`,
      height: `${size}px`,
      top: "50%",
      left: "50%",
      marginTop: `-${size / 2}px`,
      marginLeft: `-${size / 2}px`,
      transform: tilt,
    }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: "linear" }}
  >
    <div
      className="w-full h-full rounded-full border-2"
      style={{
        borderColor: "transparent",
        borderTopColor: color,
        borderRightColor: `${color}80`,
        filter: `drop-shadow(0 0 8px ${color})`,
      }}
    />
  </motion.div>
);

/* ─── Latest Releases Bottom Bar ─── */
const LatestReleasesBar = () => {
  const [releases, setReleases] = useState<YouTubeRelease[]>([]);

  useEffect(() => {
    fetchReleases().then((all) => {
      const singles = all.filter((r) => (r.track_count ?? 0) <= 1);
      setReleases(singles.slice(0, 5));
    });
  }, []);

  if (releases.length === 0) return null;

  return (
    <div className="relative z-20">
      {/* Dark bar */}
      <div
        className="relative py-16 md:py-20"
        style={{
          background: "linear-gradient(180deg, hsl(260 20% 12%) 0%, hsl(250 18% 10%) 100%)",
        }}
      >
        {/* Faint equalizer pattern */}
        <div className="absolute inset-0 overflow-hidden opacity-[0.04] pointer-events-none">
          <div className="flex items-end justify-center gap-1 h-full pb-4">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-white rounded-full"
                style={{ height: `${20 + Math.sin(i * 0.4) * 40 + Math.random() * 30}%` }}
              />
            ))}
          </div>
        </div>

        {/* Album covers — offset upward to overlap hero */}
        <div className="container mx-auto px-6 -mt-28 md:-mt-32">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-white/50 mb-6 pt-4">
            Latest Releases
          </p>
          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {releases.map((r) => {
              const thumb =
                r.thumbnail_url?.replace(/&amp;/g, "&") ||
                (r.video_id
                  ? `https://img.youtube.com/vi/${r.video_id}/mqdefault.jpg`
                  : null);
              return (
                <Link
                  key={r.id}
                  to={`/release/${r.id}`}
                  className="flex-shrink-0 group"
                >
                  <motion.div
                    className="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden border border-white/10 transition-shadow"
                    whileHover={{
                      y: -8,
                      boxShadow: "0 0 20px rgba(255, 0, 255, 0.4), 0 0 40px rgba(180, 100, 255, 0.2)",
                    }}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={r.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center text-white/30 text-2xl">
                        ♪
                      </div>
                    )}
                  </motion.div>
                  <p className="text-xs text-white/70 mt-2 truncate max-w-[8rem] md:max-w-[10rem] group-hover:text-white transition-colors">
                    {r.title}
                  </p>
                  <p className="text-[10px] text-white/40">{r.year || "Single"}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   HERO SECTION — Main Export
   ═══════════════════════════════════════════════ */
export const HeroSection = () => {
  return (
    <section className="relative">
      {/* ── Main Hero Area ── */}
      <div className="relative min-h-[85vh] flex items-end overflow-hidden">
        {/* Background gradient — peach to purple */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, hsl(35 50% 88%) 0%, hsl(320 25% 82%) 30%, hsl(280 35% 72%) 60%, hsl(260 45% 55%) 100%)",
          }}
        />

        {/* Musical overlays */}
        <MusicalOverlay />

        {/* Audio waveform background */}
        <WaveformBg />

        {/* Particle shimmer */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/60"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float-particle ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 3}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Glassmorphic floating player */}
        <FloatingPlayer />

        {/* Hero portrait — right side with orbit effects */}
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-[55%] flex items-center justify-end">
          <div className="relative h-full w-full flex items-center justify-center">
            {/* Cyan/purple glow aura */}
            <div
              className="absolute inset-0 opacity-50"
              style={{
                background:
                  "radial-gradient(ellipse 50% 60% at 60% 40%, hsl(190 80% 70% / 0.4), transparent 70%), radial-gradient(ellipse 40% 50% at 50% 50%, hsl(260 50% 75% / 0.3), transparent 70%)",
              }}
            />

            {/* Orbiting light rings */}
            <OrbitRing
              color="hsl(190, 80%, 65%)"
              size={400}
              duration={12}
              tilt="rotateX(65deg) rotateZ(-15deg)"
            />
            <OrbitRing
              color="hsl(320, 60%, 65%)"
              size={350}
              duration={16}
              tilt="rotateX(70deg) rotateZ(25deg)"
            />

            {/* Floating vinyls */}
            <VinylRecord
              className="absolute -left-4 md:left-4 top-[15%] w-16 h-16 md:w-20 md:h-20 opacity-60"
              delay={0}
            />
            <VinylRecord
              className="absolute right-8 md:right-16 bottom-[25%] w-12 h-12 md:w-16 md:h-16 opacity-40"
              delay={2}
            />

            {/* Hero image */}
            <img
              src={heroImage}
              alt="Cola B — Digital Singer-Songwriter"
              className="relative h-full w-full object-cover object-top z-10"
              style={{
                maskImage: "linear-gradient(to left, black 40%, transparent 95%)",
                WebkitMaskImage: "linear-gradient(to left, black 40%, transparent 95%)",
              }}
            />
          </div>
        </div>

        {/* Content — left-aligned, bottom portion */}
        <div className="relative container mx-auto px-6 pb-32 md:pb-40 pt-40 z-10">
          <motion.h1
            className="text-hero font-display font-bold text-foreground mb-4 tracking-[0.08em]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            COLA B
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl font-display font-medium text-foreground/80 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Digital Singer-Songwriter.
          </motion.p>
          <motion.p
            className="text-sm md:text-base text-muted-foreground max-w-md mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Living her music, life, and moments.
          </motion.p>
          <motion.div
            className="flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Link to="/music">
              <motion.span
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold tracking-wider uppercase backdrop-blur-sm border border-white/30 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, hsl(35 60% 78% / 0.6), hsl(340 35% 80% / 0.6))",
                  color: "hsl(240 10% 15%)",
                }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 25px rgba(180, 100, 255, 0.4)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                Listen Now <Play className="h-4 w-4" />
              </motion.span>
            </Link>
            <Link to="/videos">
              <motion.span
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-foreground/20 text-foreground text-sm font-semibold tracking-wider uppercase backdrop-blur-sm cursor-pointer"
                style={{ background: "hsl(0 0% 100% / 0.15)" }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 25px rgba(180, 100, 255, 0.35)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                Watch Video <Video className="h-4 w-4" />
              </motion.span>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* ── Latest Releases Bottom Bar ── */}
      <LatestReleasesBar />
    </section>
  );
};
