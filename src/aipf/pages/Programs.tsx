import { useSEO } from "@/hooks/useSEO";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { useAipfT } from "@/aipf/i18n";

function Inner() {
  const { t } = useAipfT();
  useSEO({ title: t("prog.seoTitle"), exactTitle: true });
  const phases: { label: string; h: string; items: [string, string][] }[] = [
    {
      label: t("prog.now"),
      h: t("prog.now.h"),
      items: [1,2,3,4,5].map((n) => [t(`prog.now.${n}.t`), t(`prog.now.${n}.c`)]) as [string,string][],
    },
    {
      label: t("prog.next"),
      h: t("prog.next.h"),
      items: [1,2,3,4,5].map((n) => [t(`prog.next.${n}.t`), t(`prog.next.${n}.c`)]) as [string,string][],
    },
    {
      label: t("prog.later"),
      h: t("prog.later.h"),
      items: [1,2].map((n) => [t(`prog.later.${n}.t`), t(`prog.later.${n}.c`)]) as [string,string][],
    },
  ];
  return (
    <>
      <section className="container mx-auto px-6 py-16 max-w-4xl">
        <SectionLabel>{t("prog.label")}</SectionLabel>
        <h1 className="font-institutional text-5xl md:text-6xl mt-3">{t("prog.title")}</h1>
        <GoldDivider className="my-6" />
      </section>

      {phases.map((phase) => (
        <section key={phase.label} className="container mx-auto px-6 pb-16">
          <div className="flex items-baseline gap-4">
            <span className="px-3 py-1 text-[0.7rem] uppercase tracking-[0.2em]" style={{ background: "hsl(var(--foundation-navy))", color: "hsl(var(--institution-white))" }}>
              {phase.label}
            </span>
            <h2 className="font-institutional text-2xl text-muted-foreground">{phase.h}</h2>
          </div>
          <GoldDivider className="my-6" />
          <div className="grid md:grid-cols-3 gap-6">
            {phase.items.map(([title, c]) => (
              <div key={title} className="aipf-frame p-6">
                <div className="aipf-label">{phase.label}</div>
                <h3 className="font-institutional text-xl mt-2">{title}</h3>
                <p className="text-sm text-foreground/80 mt-2">{c}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

export default function Programs() {
  return <AipfLayout><Inner /></AipfLayout>;
}
