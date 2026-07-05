import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { ProfileHeader, LinkList, AchievementList, EmptyState } from "@/aipf/components/Directory";
import { BrokenLinkReportModal } from "@/aipf/components/BrokenLinkReportModal";
import { MemberBadge, BadgeDownloadButton } from "@/aipf/components/MemberBadge";
import { getEntityBySlug, getEntityLinks, getEntityAchievements } from "@/aipf/services";
import { verifyUrl } from "@/aipf/lib/utils";
import type { AipfEntity, AipfEntityLink, AipfAchievement } from "@/aipf/types";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
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
    jsonLd: entity && !entity.is_sample
      ? {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: entity.entity_name,
          url: `https://colabbmusic.com/aipf/directory/${entity.slug}`,
          description: entity.bio || undefined,
          identifier: entity.member_number || undefined,
          memberOf: {
            "@type": "Organization",
            name: "AI People Foundation",
            url: "https://colabbmusic.com/aipf",
          },
          sameAs: links.filter((l) => l.show_publicly).map((l) => l.url),
        }
      : undefined,
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

      {entity.member_number && !entity.is_sample && (
        <section className="container mx-auto px-6 py-12">
          <div className="aipf-frame overflow-hidden">
            <div className="aipf-navy px-8 py-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <SectionLabel>{t("record.label")}</SectionLabel>
                <h2 className="font-institutional text-2xl text-white mt-1">{t("record.title")}</h2>
              </div>
              <div className="text-right">
                <div className="text-[0.65rem] uppercase tracking-[0.22em] opacity-70 text-white">{t("prof.memberNumber")}</div>
                <div className="font-institutional text-xl text-white">{entity.member_number}</div>
              </div>
            </div>
            <div className="p-8 grid lg:grid-cols-[minmax(280px,440px)_1fr] gap-10 items-start">
              <div>
                <MemberBadge e={entity} />
                <div className="mt-4 flex flex-wrap gap-3">
                  <BadgeDownloadButton e={entity} />
                  <Link to={`/aipf/certificate/${entity.slug}`}>
                    <Button variant="outline" size="sm">{t("record.viewCertificate")}</Button>
                  </Link>
                </div>
              </div>
              <div className="text-sm space-y-4">
                <p className="text-foreground/80">{t("record.blurb")}</p>
                <div>
                  <div className="aipf-label mb-1">{t("record.verifyAt")}</div>
                  <button
                    className="aipf-link font-mono text-xs break-all text-left"
                    onClick={() => {
                      navigator.clipboard.writeText(verifyUrl(entity.member_number!));
                      toast({ title: t("record.copied") });
                    }}
                  >
                    {verifyUrl(entity.member_number)}
                  </button>
                </div>
                {entity.created_at && (
                  <div>
                    <div className="aipf-label mb-1">{t("verify.record.since")}</div>
                    <div>{new Date(entity.created_at).toLocaleDateString()}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
