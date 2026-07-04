import { useEffect, useMemo, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "react-router-dom";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { DirectoryCard, EmptyState } from "@/aipf/components/Directory";
import { listPublishedEntities } from "@/aipf/services";
import type { AipfEntity } from "@/aipf/types";
import { Input } from "@/components/ui/input";
import { AIPF_CATEGORIES } from "@/aipf/lib/constants";
import { useAipfT } from "@/aipf/i18n";

function DirectoryInner() {
  const { t } = useAipfT();
  useSEO({ title: t("dir.seoTitle"), description: t("dir.seoDesc"), exactTitle: true });
  const [entities, setEntities] = useState<AipfEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("");
  const [cohortOnly, setCohortOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    listPublishedEntities().then((data) => {
      setEntities(data);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return entities.filter((e) => {
      if (category && e.category !== category) return false;
      if (cohortOnly && !e.founding_cohort) return false;
      if (verifiedOnly && !["verified", "identity_reviewed", "official"].includes(e.verification_status)) return false;
      if (q) {
        const s = q.toLowerCase();
        const hay = [e.entity_name, e.creator_studio_name, e.country_region, e.category, e.bio]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [entities, q, category, cohortOnly, verifiedOnly]);

  const allSample = entities.length > 0 && entities.every((e) => e.is_sample);

  return (
    <>
      <section className="container mx-auto px-6 py-16">
        <SectionLabel>{t("dir.label")}</SectionLabel>
        <h1 className="font-institutional text-5xl md:text-6xl mt-3">{t("dir.title")}</h1>
        <GoldDivider className="my-6" />
        <p className="text-foreground/80 max-w-3xl">{t("dir.intro")}</p>
        {allSample && (
          <div className="mt-6 aipf-frame p-4 text-sm text-foreground/80">
            {t("dir.sampleNotice")}
          </div>
        )}
      </section>

      <section className="container mx-auto px-6 pb-8">
        <div className="grid md:grid-cols-[1fr_240px_auto_auto] gap-3 items-center">
          <Input placeholder={t("dir.searchPlaceholder")} value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 px-3 border border-input bg-background text-sm">
            <option value="">{t("dir.allCategories")}</option>
            {AIPF_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
          <label className="text-xs uppercase tracking-[0.14em] flex items-center gap-2">
            <input type="checkbox" checked={cohortOnly} onChange={(e) => setCohortOnly(e.target.checked)} />
            {t("dir.founding")}
          </label>
          <label className="text-xs uppercase tracking-[0.14em] flex items-center gap-2">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
            {t("dir.verified")}
          </label>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-24">
        {loading ? (
          <p className="text-center text-muted-foreground py-16">{t("dir.loading")}</p>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={t("dir.empty.title")}
            copy={t("dir.empty.copy")}
            action={
              <div className="flex gap-3 justify-center">
                <Link to="/aipf/register-interest" className="px-5 py-2 text-xs uppercase tracking-[0.16em] bg-[hsl(var(--foundation-navy))] text-white">{t("nav.register")}</Link>
                <Link to="/aipf/nominate" className="px-5 py-2 text-xs uppercase tracking-[0.16em] border">{t("nav.nominate")}</Link>
              </div>
            }
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((e) => <DirectoryCard key={e.id} e={e} />)}
          </div>
        )}
      </section>
    </>
  );
}

export default function Directory() {
  return <AipfLayout><DirectoryInner /></AipfLayout>;
}
