import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/editorial/Reveal";
import { EmailSignup } from "@/components/marketing/EmailSignup";
import heroDesktop from "@/assets/campaign/hero-desktop.jpg";

export const ClosingStatement = () => {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0" aria-hidden="true">
        <img src={heroDesktop} alt="" loading="lazy" className="h-full w-full object-cover object-center opacity-25" />
        <div className="absolute inset-0 bg-cola-ink/80" />
      </div>

      <div className="relative editorial band text-center">
        <Reveal>
          <h2 className="font-display text-section text-cola-pearl text-balance">{t("hp.closingTitle")}</h2>
          <p className="mt-5 text-body-lg text-cola-pearl/70 max-w-lg mx-auto">{t("hp.closingBody")}</p>
        </Reveal>
        <Reveal delay={120} className="mt-10 max-w-xl mx-auto">
          <EmailSignup source="homepage-closing" variant="inline" />
        </Reveal>
      </div>
    </section>
  );
};
