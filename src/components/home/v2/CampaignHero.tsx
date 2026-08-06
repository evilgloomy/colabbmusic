import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EditorialImage } from "@/components/editorial/EditorialImage";
import heroDesktop from "@/assets/campaign/hero-desktop.jpg";
import heroMobile from "@/assets/campaign/hero-mobile.jpg";

export const CampaignHero = () => {
  const { t } = useTranslation();

  return (
    <section
      className="relative flex items-center overflow-hidden bg-cola-ink"
      style={{ minHeight: "min(900px, 100svh)" }}
    >
      <div className="absolute inset-0 hidden md:block" style={{ height: "100%" }} aria-hidden="true" />

      {/* Portrait — wide campaign frame on desktop, vertical crop on mobile */}
      <EditorialImage
        src={heroDesktop}
        mobileSrc={heroMobile}
        alt="Cola B — campaign portrait"
        objectPositionDesktop="72% center"
        objectPositionTablet="70% center"
        objectPositionMobile="62% center"
        priority
        className="!absolute inset-0 h-full w-full"
      />

      {/* Scrims: readable type, never across her face */}
      <div className="absolute inset-0 ink-scrim hidden md:block" aria-hidden="true" />
      <div className="absolute inset-0 ink-scrim-bottom md:hidden" aria-hidden="true" />

      <div className="relative editorial w-full flex md:items-center min-h-inherit">
        <div
          className="max-w-[650px] w-full pt-32 md:pt-28 pb-12 md:pb-16 self-end md:self-center"
          style={{ marginTop: "clamp(4rem, 8vh, 6.25rem)" }}
        >
          <p className="label text-cola-blush mb-5 animate-fade-in opacity-0" style={{ animationDelay: "0.1s" }}>
            {t("hp.heroKicker")}
          </p>
          <h2
            className="font-display hero-title text-cola-pearl animate-fade-in opacity-0"
            style={{ animationDelay: "0.2s" }}
          >
            {t("hp.heroTitle")}
          </h2>
          <p
            className="font-display hero-subtitle italic text-cola-blush mt-5 animate-fade-in opacity-0"
            style={{ animationDelay: "0.35s" }}
          >
            {t("hp.heroSubtitle")}
          </p>
          <p
            className="hero-support mt-6 text-cola-pearl/70 animate-fade-in opacity-0"
            style={{ animationDelay: "0.5s" }}
          >
            {t("hp.heroSupport")}
          </p>
          <div className="mt-9 flex flex-wrap gap-4 animate-fade-in opacity-0" style={{ animationDelay: "0.65s" }}>
            <Link
              to="/music"
              className="min-h-[44px] inline-flex items-center px-8 py-4 bg-cola-pink text-cola-ink text-xs font-semibold tracking-[0.2em] uppercase transition-opacity hover:opacity-90 active:scale-[0.98]"
            >
              {t("hp.heroListen")}
            </Link>
            <Link
              to="/story"
              className="min-h-[44px] inline-flex items-center px-8 py-4 border border-cola-pearl/35 text-cola-pearl text-xs font-semibold tracking-[0.2em] uppercase transition-colors hover:border-cola-pearl/70"
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
