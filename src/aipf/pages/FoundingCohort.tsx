import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { useAipfT } from "@/aipf/i18n";

function Inner() {
  const { t } = useAipfT();
  useSEO({ title: t("found.seoTitle"), description: t("found.seoDesc"), exactTitle: true });
  return (
    <>
      <section className="container mx-auto px-6 py-16 max-w-4xl">
        <SectionLabel>{t("found.label")}</SectionLabel>
        <h1 className="font-institutional text-5xl md:text-6xl mt-3">{t("found.title")}</h1>
        <GoldDivider className="my-6" />
        <p className="text-lg text-foreground/85 leading-relaxed">{t("found.intro")}</p>
      </section>

      <section className="container mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
          <div className="aipf-frame p-6">
            <SectionLabel>{t("found.comp.label")}</SectionLabel>
            <ul className="mt-3 space-y-2 text-sm">
              <li>· {t("found.comp.1a")} <strong>{t("found.comp.1b")}</strong></li>
              <li>· {t("found.comp.2")}</li>
              <li>· {t("found.comp.3")}</li>
              <li>· {t("found.comp.4")}</li>
              <li>· {t("found.comp.5")}</li>
              <li>· {t("found.comp.6")}</li>
            </ul>
          </div>
          <div className="aipf-frame p-6">
            <SectionLabel>{t("found.sel.label")}</SectionLabel>
            <ul className="mt-3 space-y-2 text-sm">
              {[1,2,3,4,5,6].map((n) => <li key={n}>· {t(`found.sel.${n}`)}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16 max-w-3xl text-center">
        <div className="aipf-frame p-10">
          <SectionLabel>{t("found.status.label")}</SectionLabel>
          <h2 className="font-institutional text-3xl mt-3">{t("found.status.title")}</h2>
          <GoldDivider className="my-6 mx-auto" />
          <p className="text-foreground/80">{t("found.status.body")}</p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link to="/aipf/join" className="px-5 py-2 text-xs uppercase tracking-[0.16em] bg-[hsl(var(--foundation-navy))] text-white">{t("nav.join")}</Link>
            <Link to="/aipf/nominate" className="px-5 py-2 text-xs uppercase tracking-[0.16em] border">{t("nav.nominate")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default function FoundingCohort() {
  return <AipfLayout><Inner /></AipfLayout>;
}
