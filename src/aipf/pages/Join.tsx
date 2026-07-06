import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider, SealLogo } from "@/aipf/components/Chrome";
import { useAipfT } from "@/aipf/i18n";

function Inner() {
  const { t } = useAipfT();
  useSEO({ title: t("join.seoTitle"), description: t("join.seoDesc"), exactTitle: true });
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const steps: [string, string][] = [
    [t("join.s1.t"), t("join.s1.c")],
    [t("join.s2.t"), t("join.s2.c")],
    [t("join.s3.t"), t("join.s3.c")],
    [t("join.s4.t"), t("join.s4.c")],
  ];

  return (
    <>
      <section className="container mx-auto px-6 py-20 max-w-4xl text-center">
        <SealLogo size={64} className="mx-auto" />
        <SectionLabel className="mt-6">{t("join.label")}</SectionLabel>
        <h1 className="font-institutional text-5xl md:text-6xl mt-3">{t("join.title")}</h1>
        <GoldDivider className="my-8 mx-auto" />
        <p className="text-foreground/80 max-w-2xl mx-auto">{t("join.intro")}</p>
      </section>

      <section className="container mx-auto px-6 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[hsl(var(--ceremonial-gold))/0.4] border border-[hsl(var(--ceremonial-gold))/0.4] max-w-5xl mx-auto">
          {steps.map(([title, copy], i) => (
            <div key={title} className="bg-[hsl(var(--card))] p-6">
              <div
                className="w-10 h-10 flex items-center justify-center font-institutional text-lg border"
                style={{ borderColor: "hsl(var(--ceremonial-gold))", color: "hsl(var(--foundation-navy))" }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="font-institutional text-xl mt-4">{title}</h3>
              <p className="text-xs text-foreground/70 mt-2 leading-relaxed">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Link to="/aipf/apply" className="aipf-navy p-8 flex flex-col hover:opacity-95 transition-opacity">
            <SectionLabel>{t("join.apply.label")}</SectionLabel>
            <h2 className="font-institutional text-3xl text-white mt-2">{t("join.apply.title")}</h2>
            <p className="text-sm text-white/75 mt-3 flex-1">{t("join.apply.copy")}</p>
            <div className="mt-6 text-xs uppercase tracking-[0.18em]" style={{ color: "hsl(var(--ceremonial-gold))" }}>
              {t("join.apply.cta")} →
            </div>
          </Link>

          <Link to="/aipf/nominate" className="aipf-frame p-8 flex flex-col hover:shadow-lg transition-shadow">
            <SectionLabel>{t("join.nominate.label")}</SectionLabel>
            <h2 className="font-institutional text-3xl mt-2">{t("join.nominate.title")}</h2>
            <p className="text-sm text-foreground/75 mt-3 flex-1">{t("join.nominate.copy")}</p>
            <div className="mt-6 text-xs uppercase tracking-[0.18em] text-[hsl(var(--foundation-navy))]">
              {t("join.nominate.cta")} →
            </div>
          </Link>

          <Link to="/aipf/claim" className="aipf-frame p-8 flex flex-col hover:shadow-lg transition-shadow" style={{ borderColor: "hsl(var(--ceremonial-gold))" }}>
            <SectionLabel>{t("join.claim.label")}</SectionLabel>
            <h2 className="font-institutional text-3xl mt-2">{t("join.claim.title")}</h2>
            <p className="text-sm text-foreground/75 mt-3 flex-1">{t("join.claim.copy")}</p>
            <div className="mt-6 text-xs uppercase tracking-[0.18em]" style={{ color: "hsl(var(--ceremonial-gold))" }}>
              {t("join.claim.cta")} →
            </div>
          </Link>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-10 max-w-xl mx-auto">{t("join.note")}</p>
      </section>
    </>
  );
}

export default function Join() {
  return <AipfLayout><Inner /></AipfLayout>;
}
