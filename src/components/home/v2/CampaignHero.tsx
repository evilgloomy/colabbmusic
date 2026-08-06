import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import heroDesktop from "@/assets/campaign/hero-desktop.jpg";
import heroMobile from "@/assets/campaign/hero-mobile.jpg";

export const CampaignHero = () => {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[92vh] md:min-h-[100svh] flex items-end overflow-hidden bg-cola-ink">
      {/* Portrait — vertical crop on mobile, wide campaign frame on desktop */}
      <picture>
        <source media="(min-width: 768px)" srcSet={heroDesktop} />
        <img
          src={heroMobile}
          alt="Cola B — campaign portrait"
          width={1536}
          height={1024}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[72%_18%] md:object-[70%_center]"
        />
      </picture>

      {/* Scrims: readable type, no muddy grey */}
      <div className="absolute inset-0 ink-scrim hidden md:block" aria-hidden="true" />
      <div className="absolute inset-0 ink-scrim-bottom md:hidden" aria-hidden="true" />
      <div className="absolute inset-0 aurora-veil mix-blend-screen opacity-60" aria-hidden="true" />

      <div className="relative editorial w-full pb-20 md:pb-28 pt-40">
        <div className="max-w-2xl">
          <p className="label text-cola-blush mb-6 animate-fade-in opacity-0" style={{ animationDelay: "0.1s" }}>
            {t("hp.heroKicker")}
          </p>
          <h1
            className="font-display text-hero text-cola-pearl animate-fade-in opacity-0"
            style={{ animationDelay: "0.25s" }}
          >
            {t("hp.heroTitle1")}
            <span className="block italic text-cola-blush">{t("hp.heroTitle2")}</span>
          </h1>
          <p
            className="mt-8 text-body-lg text-cola-pearl/75 max-w-md animate-fade-in opacity-0"
            style={{ animationDelay: "0.45s" }}
          >
            {t("hp.heroTagline")}
          </p>
          <div className="mt-10 flex flex-wrap gap-4 animate-fade-in opacity-0" style={{ animationDelay: "0.65s" }}>
            <Link
              to="/music"
              className="px-9 py-4 bg-cola-pink text-cola-ink text-xs font-semibold tracking-[0.2em] uppercase transition-opacity hover:opacity-90 active:scale-[0.98]"
            >
              {t("hp.heroListen")}
            </Link>
            <Link
              to="/story"
              className="px-9 py-4 border border-cola-pearl/35 text-cola-pearl text-xs font-semibold tracking-[0.2em] uppercase transition-colors hover:border-cola-pearl/70"
            >
              {t("hp.heroWorld")}
            </Link>
          </div>
        </div>
      </div>

      <span className="absolute bottom-6 right-6 label text-cola-pearl/40 hidden md:block">{t("hp.heroScroll")}</span>
    </section>
  );
};
