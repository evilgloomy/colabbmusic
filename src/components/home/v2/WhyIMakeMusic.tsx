import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Reveal, Kicker } from "@/components/editorial/Reveal";
import portrait from "@/assets/campaign/portrait-close.jpg";

export const WhyIMakeMusic = () => {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden bg-cola-wine/25">
      <div className="absolute inset-0" aria-hidden="true">
        <img src={portrait} alt="" loading="lazy" className="h-full w-full object-cover object-center opacity-45" />
        <div className="absolute inset-0 ink-scrim hidden md:block" />
        <div className="absolute inset-0 ink-scrim-bottom md:hidden" />
      </div>

      <div className="relative editorial band">
        <div className="max-w-xl">
          <Reveal>
            <Kicker className="!text-cola-blush">{t("hp.whyLabel")}</Kicker>
            <h2 className="font-display text-section mt-5 text-cola-pearl text-balance">{t("hp.whyTitle")}</h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-8 text-body-lg text-cola-pearl/80 font-editorial-cjk">{t("hp.whyBody")}</p>
            <Link
              to="/about-cola"
              className="mt-10 inline-block label text-cola-pearl border-b border-cola-pearl/40 pb-1 hover:border-cola-pink hover:text-cola-pink transition-colors"
            >
              {t("hp.whyCta")}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
