import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchReleases } from "@/lib/youtube";
import { Reveal, Kicker } from "@/components/editorial/Reveal";
import studioGlow from "@/assets/campaign/studio-glow.jpg";

export const ProofOfScale = () => {
  const { t } = useTranslation();
  const [releaseCount, setReleaseCount] = useState<number | null>(null);

  useEffect(() => {
    fetchReleases().then((all) => setReleaseCount(all.length));
  }, []);

  const stats: [string, string][] = [
    [releaseCount !== null && releaseCount > 0 ? String(releaseCount) : "—", t("hp.scaleReleases")],
    ["8+", t("hp.scalePlatforms")],
    ["3", t("hp.scaleLanguages")],
  ];

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0" aria-hidden="true">
        <img src={studioGlow} alt="" loading="lazy" className="h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-cola-ink/70" />
        <div className="absolute inset-0 aurora-veil mix-blend-screen opacity-70" />
      </div>

      <div className="relative editorial band-tight">
        <Reveal>
          <Kicker className="!text-cola-blush">{t("hp.scaleLabel")}</Kicker>
          <h2 className="font-display text-display-lg mt-4 text-cola-pearl max-w-xl text-balance">
            {t("hp.scaleTitle")}
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-3 gap-6 max-w-3xl">
          {stats.map(([value, label], i) => (
            <Reveal key={label} delay={i * 90}>
              <p className="font-display text-4xl md:text-6xl text-cola-pearl">{value}</p>
              <p className="label text-cola-pearl/50 mt-3">{label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
