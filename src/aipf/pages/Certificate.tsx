import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { AipfLayout } from "@/aipf/AipfLayout";
import { EmptyState } from "@/aipf/components/Directory";
import { SealLogo } from "@/aipf/components/Chrome";
import { getEntityBySlug } from "@/aipf/services";
import type { AipfEntity } from "@/aipf/types";
import { Button } from "@/components/ui/button";
import { useAipfT } from "@/aipf/i18n";

const GOLD = "hsl(var(--ceremonial-gold))";
const NAVY = "hsl(var(--foundation-navy))";

function Inner() {
  const { t } = useAipfT();
  const { slug = "" } = useParams();
  const [entity, setEntity] = useState<AipfEntity | null | undefined>(undefined);

  useEffect(() => {
    getEntityBySlug(slug).then(setEntity);
  }, [slug]);

  useSEO({
    title: entity ? `${t("cert.seoTitle")} — ${entity.entity_name}` : t("cert.seoTitle"),
    description: t("cert.seoDesc"),
    exactTitle: true,
    noindex: true,
  });

  if (entity === undefined) {
    return <div className="container mx-auto px-6 py-24 text-center text-muted-foreground">{t("common.loading")}</div>;
  }

  // Certificates exist only for real, numbered, published records.
  if (entity === null || entity.is_sample || !entity.member_number) {
    return (
      <div className="container mx-auto px-6 py-24">
        <EmptyState
          title={t("cert.notAvailable.title")}
          copy={t("cert.notAvailable.copy")}
          action={<Link to="/aipf/directory" className="aipf-link text-sm">{t("prof.notFound.back")}</Link>}
        />
      </div>
    );
  }

  const acceptedDate = entity.created_at
    ? new Date(entity.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "2026";

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="aipf-cert-noprint max-w-3xl mx-auto mb-8 flex items-center justify-between gap-4">
        <Link to={`/aipf/directory/${entity.slug}`} className="text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
          {t("prof.back")}
        </Link>
        <Button onClick={() => window.print()}>{t("cert.print")}</Button>
      </div>

      <div
        className="aipf-certificate max-w-3xl mx-auto p-3"
        style={{ background: NAVY }}
      >
        <div className="border p-2" style={{ borderColor: GOLD, background: "hsl(var(--institution-white))" }}>
          <div className="border relative px-8 py-14 md:px-16 text-center" style={{ borderColor: GOLD }}>
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
              <SealLogo size={280} className="opacity-[0.05]" />
            </div>

            <div className="relative">
              <SealLogo size={88} className="mx-auto" />
              <div className="mt-5 font-institutional text-2xl tracking-[0.14em] uppercase" style={{ color: NAVY }}>
                AI People Foundation
              </div>
              <div
                className="mt-2 text-[0.7rem] uppercase tracking-[0.3em]"
                style={{ color: GOLD }}
              >
                {t("cert.certificateOf")}
              </div>

              <div className="mt-10 text-[0.7rem] uppercase tracking-[0.26em] text-muted-foreground">
                {t("cert.thisCertifies")}
              </div>
              <h1 className="mt-3 font-institutional text-4xl md:text-5xl tracking-wide" style={{ color: NAVY }}>
                {entity.entity_name}
              </h1>
              {entity.creator_studio_name && (
                <div className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {entity.creator_studio_name}
                </div>
              )}

              <div className="mt-8 text-sm text-muted-foreground">{t("cert.acceptedAs")}</div>
              <div className="mt-2 font-institutional text-2xl uppercase tracking-[0.12em]" style={{ color: GOLD }}>
                {entity.member_type || "Member"}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{t("cert.ofFoundation")}</div>
              {entity.founding_cohort && (
                <div className="mt-1 text-[0.7rem] uppercase tracking-[0.26em]" style={{ color: NAVY }}>
                  {t("cert.foundingCohort")}
                </div>
              )}

              <div className="mt-12 grid grid-cols-2 gap-8 max-w-md mx-auto text-left">
                <div className="text-center">
                  <div className="text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">{t("cert.memberNo")}</div>
                  <div className="mt-1 font-institutional text-lg border-t pt-2" style={{ borderColor: GOLD, color: NAVY }}>
                    {entity.member_number}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">{t("cert.acceptedOn")}</div>
                  <div className="mt-1 font-institutional text-lg border-t pt-2" style={{ borderColor: GOLD, color: NAVY }}>
                    {acceptedDate}
                  </div>
                </div>
              </div>

              <div className="mt-12 max-w-xs mx-auto">
                <div className="font-institutional italic text-3xl" style={{ color: NAVY }}>Cola B</div>
                <div className="border-t mt-2 pt-2 text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground" style={{ borderColor: GOLD }}>
                  {t("cert.chair")}
                </div>
              </div>

              <div className="mt-10 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground/70">
                colabbmusic.com/aipf/verify/{entity.member_number}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Certificate() {
  return (
    <AipfLayout>
      <div className="aipf-cert-page"><Inner /></div>
    </AipfLayout>
  );
}
