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

export default function PublicProfile() {
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

  if (entity === undefined) {
    return (
      <AipfLayout>
        <div className="container mx-auto px-6 py-24 text-center text-muted-foreground">Loading…</div>
      </AipfLayout>
    );
  }

  if (entity === null) {
    return (
      <AipfLayout>
        <div className="container mx-auto px-6 py-24">
          <EmptyState
            title="Entry not found"
            copy="This directory entry may not exist yet or is not published."
            action={<Link to="/aipf/directory" className="aipf-link text-sm">← Back to Directory</Link>}
          />
        </div>
      </AipfLayout>
    );
  }

  return (
    <AipfLayout>
      <section className="container mx-auto px-6 py-16">
        <Link to="/aipf/directory" className="text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
          ← Directory
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

      {/* Current Official Links */}
      <section className="container mx-auto px-6 py-12">
        <div className="aipf-frame p-8">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <SectionLabel>Public Record</SectionLabel>
              <h2 className="font-institutional text-3xl mt-2">Current Official Links</h2>
            </div>
            <Button variant="outline" onClick={() => { setReportLink(null); setReportOpen(true); }}>
              Report broken link
            </Button>
          </div>
          <GoldDivider className="my-6" />
          <p className="text-sm text-muted-foreground mb-4">
            If a social account is deleted, banned, moved, or replaced, AIPF updates the record here so
            fans can always find the latest official links.
          </p>
          <LinkList links={links} onReport={(l) => { setReportLink(l); setReportOpen(true); }} />
          {entity.updated_at && (
            <p className="mt-6 text-xs text-muted-foreground">
              Last updated {new Date(entity.updated_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </section>

      {achievements.length > 0 && (
        <section className="container mx-auto px-6 py-12 max-w-3xl">
          <SectionLabel>Record</SectionLabel>
          <h2 className="font-institutional text-3xl mt-2">Notable Achievements</h2>
          <GoldDivider className="my-6" />
          <AchievementList items={achievements} />
        </section>
      )}

      {entity.status_note && (
        <section className="container mx-auto px-6 py-8 max-w-3xl">
          <div className="aipf-frame p-6 text-sm text-foreground/80">
            <SectionLabel>Foundation Note</SectionLabel>
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
    </AipfLayout>
  );
}
