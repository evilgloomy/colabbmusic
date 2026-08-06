import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Reveal, Kicker } from "@/components/editorial/Reveal";
import { EditorialImage } from "@/components/editorial/EditorialImage";
import introPortrait from "@/assets/campaign/intro-portrait.jpg";

export const PersonalIntro = () => {
  const { t } = useTranslation();
  const body = t("hp.introBody", { returnObjects: true }) as string[];

  return (
    <section className="paper-band band">
      <div className="editorial grid md:grid-cols-[44fr_56fr] gap-8 md:gap-20 items-center">
        <Reveal>
          <EditorialImage
            src={introPortrait}
            alt="Cola B — editorial portrait"
            objectPositionDesktop="62% 22%"
            objectPositionMobile="62% 20%"
            aspectRatioDesktop="4 / 5"
            className="max-h-[720px] mx-auto w-full"
          />
        </Reveal>

        <div className="mt-2 md:mt-0">
          <Reveal delay={80}>
            <Kicker className="!text-cola-wine">{t("hp.introLabel")}</Kicker>
            <h2 className="font-display text-section mt-5 text-balance">{t("hp.introHello")}</h2>
          </Reveal>
          <Reveal delay={160}>
            <div className="reading reading-cjk mt-8 space-y-5 text-body-lg text-foreground/75 font-editorial-cjk">
              {(Array.isArray(body) ? body : [String(body)]).map((line, i) => (
                <p key={i} className="whitespace-pre-line">
                  {line}
                </p>
              ))}
            </div>
            <p className="mt-8 font-display italic text-xl">{t("hp.introSign")}</p>
            <Link
              to="/about-cola"
              className="mt-8 inline-block label border-b border-current pb-1 hover:text-cola-wine transition-colors"
            >
              {t("hp.introCta")}
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
};
