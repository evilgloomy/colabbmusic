import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Reveal, Kicker } from "@/components/editorial/Reveal";
import lounge from "@/assets/campaign/lounge.jpg";

export const PersonalIntro = () => {
  const { t } = useTranslation();

  return (
    <section className="paper-band band">
      <div className="editorial grid md:grid-cols-12 gap-10 md:gap-16 items-center">
        <Reveal className="md:col-span-5">
          <div className="aspect-[4/5] overflow-hidden">
            <img
              src={lounge}
              alt="Cola B at home"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        </Reveal>

        <div className="md:col-span-7 md:pl-6">
          <Reveal delay={80}>
            <Kicker className="!text-cola-wine">{t("hp.introLabel")}</Kicker>
            <h2 className="font-display text-section mt-5 text-balance">{t("hp.introHello")}</h2>
          </Reveal>
          <Reveal delay={160}>
            <div className="reading mt-8 space-y-5 text-body-lg text-foreground/75 font-editorial-cjk">
              <p>{t("hp.introBody1")}</p>
              <p>{t("hp.introBody2")}</p>
            </div>
            <p className="mt-8 font-display italic text-xl">{t("hp.introSign")}</p>
            <Link
              to="/about-cola"
              className="mt-8 inline-block label border-b border-current pb-1 hover:text-cola-wine transition-colors"
            >
              {t("hp.whyCta")}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
