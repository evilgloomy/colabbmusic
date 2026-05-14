import { Link } from "react-router-dom";
import { Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import heroImage from "@/assets/hero-cola-b.png";

export const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[85vh] flex items-end overflow-hidden">
      {/* Warm gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg, hsl(30 20% 96%) 0%, hsl(340 18% 92%) 50%, hsl(350 22% 88%) 100%)",
        }}
      />

      {/* Portrait — right side, masked */}
      <div className="absolute right-0 top-0 bottom-0 w-full md:w-[55%]">
        <img
          src={heroImage}
          alt={t("hero.portraitAlt")}
          width={1920}
          height={812}
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover object-top"
          style={{
            maskImage: "linear-gradient(to left, black 30%, transparent 90%)",
            WebkitMaskImage: "linear-gradient(to left, black 30%, transparent 90%)",
          }}
        />
      </div>

      {/* Content — left aligned, minimal */}
      <div className="relative container mx-auto px-6 pb-24 md:pb-32 pt-48 z-10">
        <h1 className="sr-only">Cola B — Queen of Emo Pop. Official music, videos, story, and merch.</h1>
        <p
          aria-hidden="true"
          className="text-hero font-display font-bold text-foreground mb-6 animate-fade-in opacity-0"
          style={{ animationDelay: "0.2s", lineHeight: "1.05" }}
        >
          COLA B
        </p>
        <p
          className="text-lg md:text-xl font-body font-medium text-foreground/70 mb-12 animate-fade-in opacity-0 max-w-md"
          style={{ animationDelay: "0.5s" }}
        >
          {t("hero.tagline")}
        </p>
        <div
          className="flex flex-wrap items-center gap-4 animate-fade-in opacity-0"
          style={{ animationDelay: "0.8s" }}
        >
          <Link
            to="/music"
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-foreground text-background text-sm font-body font-semibold tracking-wider uppercase transition-all duration-200 hover:opacity-90 active:scale-[0.97]"
          >
            {t("hero.listenNow")} <Play className="h-4 w-4" />
          </Link>
          <Link
            to="/story"
            className="inline-flex items-center gap-2 px-8 py-3.5 border border-foreground/20 text-foreground text-sm font-body font-semibold tracking-wider uppercase hover:border-foreground/40 transition-all duration-200 active:scale-[0.97]"
          >
            {t("hero.exploreStory")}
          </Link>
        </div>
      </div>
    </section>
  );
};
