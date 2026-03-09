import { Link } from "react-router-dom";
import { Play, Video } from "lucide-react";
import heroImage from "@/assets/hero-cola-b.png";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[100vh] flex items-end overflow-hidden">
      {/* Background gradient — champagne to lavender */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, hsl(35 50% 88%) 0%, hsl(300 20% 88%) 40%, hsl(260 35% 82%) 70%, hsl(260 30% 78%) 100%)",
        }}
      />

      {/* Particle shimmer overlay */}
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

      {/* Glowing lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[2px] opacity-30 animate-pulse-glow"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(190 80% 70%), hsl(260 50% 75%), transparent)",
            top: "35%",
            left: "10%",
            transform: "rotate(-5deg)",
          }}
        />
        <div
          className="absolute w-[400px] h-[2px] opacity-20 animate-pulse-glow"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(35 70% 75%), hsl(190 80% 70%), transparent)",
            top: "55%",
            left: "5%",
            transform: "rotate(3deg)",
            animationDelay: "1.5s",
          }}
        />
      </div>

      {/* Hero portrait — right side */}
      <div className="absolute right-0 top-0 bottom-0 w-full md:w-[60%] flex items-center justify-end">
        <div className="relative h-full w-full">
          {/* Cyan/purple glow aura behind portrait */}
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse 50% 60% at 60% 40%, hsl(190 80% 70% / 0.4), transparent 70%), radial-gradient(ellipse 40% 50% at 50% 50%, hsl(260 50% 75% / 0.3), transparent 70%)",
            }}
          />
          <img
            src={heroImage}
            alt="Cola B — Digital Singer-Songwriter"
            className="relative h-full w-full object-cover object-top"
            style={{
              maskImage: "linear-gradient(to left, black 40%, transparent 95%)",
              WebkitMaskImage: "linear-gradient(to left, black 40%, transparent 95%)",
            }}
          />
        </div>
      </div>

      {/* Content — left-aligned, bottom portion */}
      <div className="relative container mx-auto px-6 pb-20 md:pb-28 pt-40 z-10">
        <h1
          className="text-hero font-display font-bold text-foreground mb-4 animate-fade-in opacity-0 tracking-[0.08em]"
          style={{ animationDelay: "0.2s" }}
        >
          COLA B
        </h1>
        <p
          className="text-lg md:text-xl font-display font-medium text-foreground/80 mb-2 animate-fade-in opacity-0"
          style={{ animationDelay: "0.4s" }}
        >
          Digital Singer-Songwriter.
        </p>
        <p
          className="text-sm md:text-base text-muted-foreground max-w-md mb-10 animate-fade-in opacity-0"
          style={{ animationDelay: "0.6s" }}
        >
          Living her music, life, and moments.
        </p>
        <div
          className="flex flex-wrap items-center gap-4 animate-fade-in opacity-0"
          style={{ animationDelay: "0.8s" }}
        >
          <Link
            to="/music"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold tracking-wider uppercase transition-all hover:scale-105 hover:shadow-lg"
            style={{
              background: "linear-gradient(135deg, hsl(35 60% 78%), hsl(340 35% 80%))",
              color: "hsl(240 10% 15%)",
            }}
          >
            Listen Now <Play className="h-4 w-4" />
          </Link>
          <Link
            to="/videos"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full border border-foreground/20 text-foreground text-sm font-semibold tracking-wider uppercase hover:border-foreground/40 transition-all hover:scale-105"
          >
            Watch Video <Video className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Sparkle decorations */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-fade-in opacity-0" style={{ animationDelay: "1.2s" }}>
        <div className="w-px h-10 bg-gradient-to-b from-transparent to-muted-foreground/30" />
      </div>

      {/* Four-point star SVG decorations */}
      <svg className="absolute right-8 bottom-12 w-5 h-5 text-white/40 animate-pulse-glow" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
      </svg>
      <svg className="absolute right-[30%] top-[20%] w-3 h-3 text-white/30 animate-pulse-glow" style={{ animationDelay: "1s" }} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
      </svg>
    </section>
  );
};
