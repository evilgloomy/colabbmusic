import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { AipfLayout } from "@/aipf/AipfLayout";
import { SectionLabel, GoldDivider, SealLogo } from "@/aipf/components/Chrome";
import { StatusBadge, MemberTypeBadge, FoundingCohortBadge } from "@/aipf/components/Directory";
import { findEntityByMemberNumber } from "@/aipf/services";
import { normalizeMemberNumber } from "@/aipf/lib/utils";
import type { AipfEntity } from "@/aipf/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAipfT } from "@/aipf/i18n";

type State =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "found"; entity: AipfEntity }
  | { kind: "notFound"; query: string }
  | { kind: "unavailable" };

function Inner() {
  const { t } = useAipfT();
  const { memberNumber } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(memberNumber || "");
  const [state, setState] = useState<State>({ kind: "idle" });

  useSEO({
    title: t("verify.seoTitle"),
    description: t("verify.seoDesc"),
    exactTitle: true,
  });

  async function check(raw: string) {
    const normalized = normalizeMemberNumber(raw);
    if (!normalized) return;
    setState({ kind: "checking" });
    const { entity, unavailable } = await findEntityByMemberNumber(normalized);
    if (unavailable) { setState({ kind: "unavailable" }); return; }
    if (!entity) { setState({ kind: "notFound", query: normalized }); return; }
    setState({ kind: "found", entity });
  }

  useEffect(() => {
    if (memberNumber) {
      setQuery(memberNumber);
      check(memberNumber);
    }
  }, [memberNumber]);

  function onSubmit() {
    const normalized = normalizeMemberNumber(query);
    if (!normalized) return;
    navigate(`/aipf/verify/${encodeURIComponent(normalized)}`);
  }

  return (
    <>
      <section className="container mx-auto px-6 py-16 max-w-3xl">
        <SectionLabel>{t("verify.label")}</SectionLabel>
        <h1 className="font-institutional text-5xl md:text-6xl mt-3">{t("verify.title")}</h1>
        <GoldDivider className="my-6" />
        <p className="text-foreground/80">{t("verify.intro")}</p>
      </section>

      <section className="container mx-auto px-6 pb-8 max-w-3xl">
        <div className="aipf-frame p-8">
          <SectionLabel>{t("verify.inputLabel")}</SectionLabel>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="AIPF-2026-001"
              className="font-mono uppercase"
              onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
            />
            <Button onClick={onSubmit} disabled={state.kind === "checking" || !query.trim()}>
              {state.kind === "checking" ? t("common.loading") : t("verify.check")}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{t("verify.hint")}</p>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-24 max-w-3xl">
        {state.kind === "found" && <RecordCard entity={state.entity} />}

        {state.kind === "notFound" && (
          <div className="aipf-frame p-8 text-center border-l-4" style={{ borderLeftColor: "hsl(var(--destructive))" }}>
            <SectionLabel>{t("verify.noRecord.label")}</SectionLabel>
            <h2 className="font-institutional text-3xl mt-3">{t("verify.noRecord.title")}</h2>
            <p className="mt-4 text-sm text-foreground/75 max-w-lg mx-auto">
              {t("verify.noRecord.copy")} <span className="font-mono">{state.query}</span>
            </p>
            <p className="mt-3 text-xs text-muted-foreground max-w-lg mx-auto">{t("verify.noRecord.note")}</p>
          </div>
        )}

        {state.kind === "unavailable" && (
          <div className="aipf-frame p-8 text-center">
            <h2 className="font-institutional text-2xl">{t("verify.unavailable.title")}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{t("verify.unavailable.copy")}</p>
          </div>
        )}

        <div className="mt-12 text-center text-sm text-muted-foreground">
          {t("verify.browse")}{" "}
          <Link to="/aipf/directory" className="aipf-link">{t("nav.directory")}</Link>
        </div>
      </section>
    </>
  );
}

function RecordCard({ entity }: { entity: AipfEntity }) {
  const { t } = useAipfT();
  return (
    <div className="aipf-frame overflow-hidden">
      <div className="aipf-navy px-8 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-white">
          <SealLogo size={40} />
          <div>
            <div className="text-[0.65rem] uppercase tracking-[0.22em] opacity-70">{t("verify.record.official")}</div>
            <div className="font-institutional text-lg leading-tight">{t("header.orgName")}</div>
          </div>
        </div>
        <div
          className="px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.2em] font-semibold"
          style={{ background: "hsl(var(--ceremonial-gold))", color: "hsl(var(--foundation-navy))" }}
        >
          {t("verify.record.active")}
        </div>
      </div>
      <div className="p-8">
        <div className="grid sm:grid-cols-[1fr_auto] gap-6 items-start">
          <div>
            <SectionLabel>{entity.category}</SectionLabel>
            <h2 className="font-institutional text-4xl mt-1">{entity.entity_name}</h2>
            {entity.creator_studio_name && (
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mt-2">
                {t("prof.by")} {entity.creator_studio_name}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="aipf-label">{t("prof.memberNumber")}</div>
            <div className="font-institutional text-2xl mt-1">{entity.member_number}</div>
          </div>
        </div>
        <GoldDivider className="my-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          {entity.member_type && (
            <div>
              <div className="aipf-label mb-1">{t("verify.record.class")}</div>
              <div>{entity.member_type}</div>
            </div>
          )}
          {entity.country_region && (
            <div>
              <div className="aipf-label mb-1">{t("prof.region")}</div>
              <div>{entity.country_region}</div>
            </div>
          )}
          {entity.created_at && (
            <div>
              <div className="aipf-label mb-1">{t("verify.record.since")}</div>
              <div>{new Date(entity.created_at).toLocaleDateString()}</div>
            </div>
          )}
          <div>
            <div className="aipf-label mb-1">{t("verify.record.status")}</div>
            <div className="flex flex-wrap gap-1.5">
              {entity.founding_cohort && <FoundingCohortBadge />}
              <StatusBadge status={entity.verification_status} />
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <div className="flex flex-wrap gap-2">
            <MemberTypeBadge type={entity.member_type} />
          </div>
          <Link
            to={`/aipf/directory/${entity.slug}`}
            className="px-5 py-2.5 text-xs uppercase tracking-[0.16em] bg-[hsl(var(--foundation-navy))] text-white"
          >
            {t("verify.record.viewProfile")}
          </Link>
        </div>
        <p className="mt-6 text-[0.7rem] text-muted-foreground leading-relaxed">{t("verify.record.disclaimer")}</p>
      </div>
    </div>
  );
}

export default function Verify() {
  return <AipfLayout><Inner /></AipfLayout>;
}
