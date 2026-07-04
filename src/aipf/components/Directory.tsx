import { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { AipfEntity, AipfEntityLink, AipfAchievement } from "../types";
import { SectionLabel, GoldDivider } from "./Chrome";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    unverified: { label: "Unverified", cls: "text-muted-foreground border-border" },
    identity_reviewed: { label: "Identity Reviewed", cls: "text-foreground border-foreground/40" },
    verified: { label: "Verified", cls: "text-foreground border-foreground" },
    official: { label: "Official", cls: "border-[hsl(var(--ceremonial-gold))] text-[hsl(var(--foundation-navy))]" },
    archived: { label: "Archived", cls: "text-muted-foreground border-border" },
  };
  const info = map[status] || { label: status, cls: "text-muted-foreground border-border" };
  return (
    <span className={`inline-block px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.18em] border ${info.cls}`}>
      {info.label}
    </span>
  );
}

export function MemberTypeBadge({ type }: { type: string | null }) {
  if (!type) return null;
  return (
    <span
      className="inline-block px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.18em] border"
      style={{ borderColor: "hsl(var(--ceremonial-gold))", color: "hsl(var(--foundation-navy))" }}
    >
      {type}
    </span>
  );
}

export function FoundingCohortBadge() {
  return (
    <span
      className="inline-block px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.18em]"
      style={{ background: "hsl(var(--foundation-navy))", color: "hsl(var(--institution-white))" }}
    >
      Founding Cohort 2026
    </span>
  );
}

export function ReviewStatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-block px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.16em] border border-border text-muted-foreground">
      {status.split("_").join(" ")}
    </span>
  );
}

export function DirectoryCard({ e }: { e: AipfEntity }) {
  const initials = e.entity_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <Link
      to={`/aipf/directory/${e.slug}`}
      className="aipf-frame block hover:shadow-lg transition-shadow relative"
    >
      {e.is_sample && (
        <div
          className="absolute top-0 right-0 px-2 py-1 text-[0.6rem] uppercase tracking-[0.16em]"
          style={{ background: "hsl(var(--soft-cream))", color: "hsl(var(--muted-ink))" }}
        >
          Sample entry
        </div>
      )}
      <div
        className="aspect-[3/4] flex items-center justify-center border-b"
        style={{ background: "hsl(var(--soft-cream))", borderColor: "hsl(var(--ceremonial-gold) / 0.4)" }}
      >
        {e.official_image_url ? (
          <img src={e.official_image_url} alt={e.entity_name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-institutional text-6xl" style={{ color: "hsl(var(--foundation-navy) / 0.4)" }}>
            {initials}
          </span>
        )}
      </div>
      <div className="p-6">
        <SectionLabel>{e.category}</SectionLabel>
        <h3 className="font-institutional text-2xl mt-2">{e.entity_name}</h3>
        {e.creator_studio_name && (
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground mt-1">
            by {e.creator_studio_name}
          </p>
        )}
        {e.country_region && (
          <p className="text-xs text-muted-foreground mt-1">{e.country_region}</p>
        )}
        {e.bio && <p className="text-sm text-foreground/80 mt-3 line-clamp-3">{e.bio}</p>}
        <GoldDivider className="my-4" />
        <div className="flex flex-wrap items-center gap-2">
          {e.founding_cohort && <FoundingCohortBadge />}
          <StatusBadge status={e.verification_status} />
        </div>
        {e.member_number && (
          <div className="mt-3 text-[0.65rem] uppercase tracking-[0.22em] text-muted-foreground">
            {e.member_number}
          </div>
        )}
      </div>
    </Link>
  );
}

export function ProfileHeader({ e }: { e: AipfEntity }) {
  const initials = e.entity_name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-10 items-start">
      <div
        className="aspect-[3/4] aipf-frame flex items-center justify-center overflow-hidden"
        style={{ background: "hsl(var(--soft-cream))" }}
      >
        {e.official_image_url ? (
          <img src={e.official_image_url} alt={e.entity_name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-institutional text-8xl" style={{ color: "hsl(var(--foundation-navy) / 0.4)" }}>
            {initials}
          </span>
        )}
      </div>
      <div>
        <SectionLabel>{e.category}</SectionLabel>
        <h1 className="font-institutional text-5xl md:text-6xl mt-2 leading-tight">{e.entity_name}</h1>
        {e.creator_studio_name && (
          <p className="text-sm uppercase tracking-[0.16em] text-muted-foreground mt-2">
            by {e.creator_studio_name}
          </p>
        )}
        <GoldDivider className="my-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
          {e.country_region && (
            <div>
              <div className="aipf-label mb-1">Region</div>
              <div>{e.country_region}</div>
            </div>
          )}
          {e.year_launched && (
            <div>
              <div className="aipf-label mb-1">Launched</div>
              <div>{e.year_launched}</div>
            </div>
          )}
          {e.member_number && (
            <div>
              <div className="aipf-label mb-1">Member Number</div>
              <div>{e.member_number}</div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-6">
          {e.founding_cohort && <FoundingCohortBadge />}
          <MemberTypeBadge type={e.member_type} />
          <StatusBadge status={e.verification_status} />
        </div>
      </div>
    </div>
  );
}

export function LinkList({ links, onReport }: { links: AipfEntityLink[]; onReport?: (l: AipfEntityLink) => void }) {
  if (!links.length) {
    return <p className="text-sm text-muted-foreground italic">No public links on file.</p>;
  }
  return (
    <ul className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
      {links.map((l) => (
        <li key={l.id} className="py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {l.platform || l.label || "Link"}
              {l.is_primary && (
                <span className="ml-2" style={{ color: "hsl(var(--ceremonial-gold))" }}>· primary</span>
              )}
            </div>
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="aipf-link text-sm truncate block">
              {l.url}
            </a>
          </div>
          {onReport && (
            <button
              onClick={() => onReport(l)}
              className="text-[0.7rem] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
            >
              Report broken
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

export function AchievementList({ items }: { items: AipfAchievement[] }) {
  if (!items.length) return null;
  return (
    <ul className="space-y-4">
      {items.map((a) => (
        <li key={a.id} className="border-l-2 pl-4" style={{ borderColor: "hsl(var(--ceremonial-gold))" }}>
          <div className="font-institutional text-lg">{a.title}</div>
          {a.year && <div className="aipf-label mt-1">{a.year}</div>}
          {a.description && <p className="text-sm text-foreground/80 mt-1">{a.description}</p>}
          {a.url && (
            <a href={a.url} target="_blank" rel="noopener noreferrer" className="aipf-link text-xs mt-1 inline-block">
              Reference
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <div className="aipf-frame p-12 text-center max-w-2xl mx-auto">
      <SectionLabel>Notice</SectionLabel>
      <h3 className="font-institutional text-3xl mt-3">{title}</h3>
      <GoldDivider className="my-6 mx-auto" />
      <p className="text-foreground/75">{copy}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function FeatureCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="aipf-frame p-6 h-full">
      <div className="font-institutional text-xl">{title}</div>
      <GoldDivider className="my-3" />
      <div className="text-sm text-foreground/80">{children}</div>
    </div>
  );
}

export function ProcessStep({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-6">
      <div
        className="shrink-0 w-12 h-12 flex items-center justify-center font-institutional text-xl border"
        style={{ borderColor: "hsl(var(--ceremonial-gold))", color: "hsl(var(--foundation-navy))" }}
      >
        {String(n).padStart(2, "0")}
      </div>
      <div>
        <h4 className="font-institutional text-xl">{title}</h4>
        <p className="text-sm text-foreground/80 mt-1">{children}</p>
      </div>
    </div>
  );
}
