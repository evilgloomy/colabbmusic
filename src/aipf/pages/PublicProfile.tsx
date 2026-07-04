import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { ProfileHeader, LinkList, AchievementList, EmptyState } from "@/aipf/components/Directory";
import { BrokenLinkReportModal } from "@/aipf/components/BrokenLinkReportModal";
import { getEntityBySlug, getEntityLinks, getEntityAchievements } from "@/aipf/services";
import type { AipfEntity, AipfEntityLink, AipfAchievement } from "@/aipf/types";
import { Button } from "@/components/ui/button";
import { useAipfT } from "@/aipf/i18n";

function Inner() {
  const { t } = useAipfT();
  const { slug = "" } = useParams();
  const [entity, setEntity] = useState<AipfEntity | null | undefined>(undefined);
  const [links, setLinks] = useState<AipfEntityLink[]>([]);
  const [achievements, setAchievements] = useState<AipfAchievement[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLink, setReportLink] = useState<AipfEntityLink | null>(null);

  useEffect(() => {
    (async () => {
      const e = await getEntityBySlug(slug);
      setEntity(e);
      if (e && !e.id.startsWith("mock-")) {
        setLinks(await getEntityLinks(e.id));
        setAchievements(await getEntityAchievements(e.id));
      }
    })();
  }, [slug]);

  useSEO({
    title: entity ? `${entity.entity_name} — AIPF Directory` : "AIPF Directory",
    description: entity?.bio || "AIPF public directory entry.",
    exactTitle: true,
  });

  if (entity === undefined) return <div className="container mx-auto px-6 py-24 text-center text-muted-foreground">{t("prof.loading")}</div>;

  if (entity === null) {
    return (
      <div className="container mx-auto px-6 py-24">
        <EmptyState
          title={t("prof.notFound.title")}
          copy={t("prof.notFound.copy")}
          action={<Link to="/aipf/directory" className="aipf-link text-sm">{t("prof.notFound.back")}</Link>}
        />
      </div>
    );
  }

  return (
    <>
      <section className="container mx-auto px-6 py-16">
        <Link to="/aipf/directory" className="text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
          {t("prof.back")}
        </Link>
        <div className="mt-6">
          <ProfileHeader e={entity} />
        </div>
      </section>

      {entity.bio && (
        <section className="container mx-auto px-6 pb-8 max-w-3xl">
          <p className="text-lg text-foreground/85 leading-relaxed">{entity.bio}</p>
        </section>
      )}

      <section className="container mx-auto px-6 py-12">
        <div className="aipf-frame p-8">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <SectionLabel>{t("prof.linksLabel")}</SectionLabel>
              <h2 className="font-institutional text-3xl mt-2">{t("prof.linksTitle")}</h2>
            </div>
            <Button variant="outline" onClick={() => { setReportLink(null); setReportOpen(true); }}>
              {t("prof.report")}
            </Button>
          </div>
          <GoldDivider className="my-6" />
          <p className="text-sm text-muted-foreground mb-4">{t("prof.linksIntro")}</p>
          <LinkList links={links} onReport={(l) => { setReportLink(l); setReportOpen(true); }} />
          {entity.updated_at && (
            <p className="mt-6 text-xs text-muted-foreground">
              {t("prof.updated")} {new Date(entity.updated_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </section>

      {achievements.length > 0 && (
        <section className="container mx-auto px-6 py-12 max-w-3xl">
          <SectionLabel>{t("prof.achievementsLabel")}</SectionLabel>
          <h2 className="font-institutional text-3xl mt-2">{t("prof.achievementsTitle")}</h2>
          <GoldDivider className="my-6" />
          <AchievementList items={achievements} />
        </section>
      )}

      {entity.status_note && (
        <section className="container mx-auto px-6 py-8 max-w-3xl">
          <div className="aipf-frame p-6 text-sm text-foreground/80">
            <SectionLabel>{t("prof.foundationNote")}</SectionLabel>
            <p className="mt-2">{entity.status_note}</p>
          </div>
        </section>
      )}

      <BrokenLinkReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        entity={entity}
        link={reportLink}
      />
    </>
  );
}

export default function PublicProfile() {
  return <AipfLayout><Inner /></AipfLayout>;
}
