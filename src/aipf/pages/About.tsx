import { useSEO } from "@/hooks/useSEO";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { FeatureCard } from "@/aipf/components/Directory";
import { useAipfT } from "@/aipf/i18n";

function AboutInner() {
  const { t } = useAipfT();
  useSEO({ title: t("about.seoTitle"), description: t("about.seoDesc"), exactTitle: true });

  const isItems = ["is1","is2","is3","is4","is5","is6","is7","is8"].map((k) => t(`about.${k}`));
  const notItems = ["not1","not2","not3","not4","not5","not6","not7"].map((k) => t(`about.${k}`));
  const pillars: [string, string][] = [
    [t("about.pillars.leg.t"), t("about.pillars.leg.c")],
    [t("about.pillars.rec.t"), t("about.pillars.rec.c")],
    [t("about.pillars.doc.t"), t("about.pillars.doc.c")],
    [t("about.pillars.con.t"), t("about.pillars.con.c")],
    [t("about.pillars.aut.t"), t("about.pillars.aut.c")],
  ];

  return (
    <>
      <section className="container mx-auto px-6 py-20 max-w-4xl">
        <SectionLabel>{t("about.label")}</SectionLabel>
        <h1 className="font-institutional text-5xl md:text-6xl mt-3">{t("about.title")}</h1>
        <GoldDivider className="my-8" />
        <p className="text-lg text-foreground/85 leading-relaxed">{t("about.intro")}</p>
        <p className="mt-6 font-institutional text-2xl italic">{t("about.thesisTop")}</p>
      </section>

      <section className="container mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aipf-frame p-8" style={{ borderColor: "hsl(var(--ceremonial-gold))" }}>
            <SectionLabel>{t("about.isLabel")}</SectionLabel>
            <h2 className="font-institutional text-3xl mt-2">{t("about.isTitle")}</h2>
            <GoldDivider className="my-4" />
            <ul className="space-y-2.5 text-foreground/85 text-sm">
              {isItems.map((x) => (
                <li key={x} className="flex gap-3">
                  <span
                    className="shrink-0 w-5 h-5 flex items-center justify-center text-[0.7rem] border rounded-full"
                    style={{ borderColor: "hsl(var(--ceremonial-gold))", color: "hsl(var(--ceremonial-gold))" }}
                  >
                    ✓
                  </span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="aipf-frame p-8" style={{ borderColor: "hsl(var(--border))" }}>
            <SectionLabel>{t("about.notLabel")}</SectionLabel>
            <h2 className="font-institutional text-3xl mt-2 text-muted-foreground">{t("about.notTitle")}</h2>
            <div className="aipf-thin-divider my-4" />
            <ul className="space-y-2.5 text-muted-foreground text-sm">
              {notItems.map((x) => (
                <li key={x} className="flex gap-3">
                  <span className="shrink-0 w-5 h-5 flex items-center justify-center text-[0.7rem] border border-border rounded-full">
                    ✕
                  </span>
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="aipf-navy py-20">
        <div className="container mx-auto px-6 max-w-3xl text-center text-white">
          <SectionLabel>{t("about.thesisLabel")}</SectionLabel>
          <p className="font-institutional text-3xl md:text-4xl mt-4 leading-tight">
            {t("about.thesis1")}<br />{t("about.thesis2")}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-6 py-20">
        <SectionLabel>{t("about.pillars.label")}</SectionLabel>
        <h2 className="font-institutional text-4xl mt-2">{t("about.pillars.title")}</h2>
        <GoldDivider className="my-8" />
        <div className="grid md:grid-cols-5 gap-4">
          {pillars.map(([title, c]) => (
            <FeatureCard key={title} title={title}>{c}</FeatureCard>
          ))}
        </div>
      </section>
    </>
  );
}

export default function About() {
  return <AipfLayout><AboutInner /></AipfLayout>;
}
