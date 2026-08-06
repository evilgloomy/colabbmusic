import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/aipf/admin/AdminShell";
import {
  listInterestSubmissions,
  updateInterestSubmission,
  upsertEntity,
  listAllEntities,
  listInvitations,
  createInvitation,
} from "@/aipf/services";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { ReviewStatusBadge } from "@/aipf/components/Directory";
import { AIPF_SUBMISSION_STATUSES, AIPF_MEMBER_TYPES } from "@/aipf/lib/constants";
import { slugify, nextMemberNumber, generateInvitationCode, claimUrl } from "@/aipf/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

// Interest submissions are not in the generated Database types yet, so
// rows arrive untyped from services; declare the fields this screen uses.
interface Row {
  id: string;
  entity_name: string;
  creator_studio_name?: string | null;
  country_region?: string | null;
  category?: string | null;
  status: string;
  created_at: string;
  contact_name?: string | null;
  contact_email?: string | null;
  year_launched?: number | null;
  follower_count?: string | null;
  main_platform_link?: string | null;
  additional_links?: string | null;
  short_bio?: string | null;
  why_include?: string | null;
  ai_native_explanation?: string | null;
  official_image_url?: string | null;
  logo_url?: string | null;
  internal_notes?: string | null;
  founding_cohort?: boolean;
  member_number?: string | null;
  interest_submission_id?: string | null;
  invitation_code?: string;
  member_type?: string | null;
}

const PIPELINE: { key: string; label: string; statuses: string[] }[] = [
  { key: "new", label: "New", statuses: ["submitted"] },
  { key: "review", label: "In review", statuses: ["under_review", "shortlisted"] },
  { key: "invited", label: "Invited", statuses: ["invited", "accepted"] },
  { key: "done", label: "Resolved", statuses: ["approved_directory", "declined", "deferred"] },
];

export default function AdminInterest() {
  const [rows, setRows] = useState<Row[]>([]);
  const [invitations, setInvitations] = useState<Row[]>([]);
  const [entities, setEntities] = useState<Partial<Row>[]>([]);
  const [tab, setTab] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const [subs, invs, ents] = await Promise.all([
      listInterestSubmissions(),
      listInvitations(),
      listAllEntities(),
    ]);
    setRows(subs);
    setInvitations(invs);
    setEntities(ents);
  }
  useEffect(() => { refresh(); }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const p of PIPELINE) c[p.key] = rows.filter((r) => p.statuses.includes(r.status)).length;
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    if (tab === "all") return rows;
    const p = PIPELINE.find((x) => x.key === tab);
    return rows.filter((r) => p?.statuses.includes(r.status));
  }, [rows, tab]);

  const selected = rows.find((r) => r.id === selectedId) || null;
  const invitationFor = (subId: string) => invitations.find((i) => i.interest_submission_id === subId);

  async function changeStatus(id: string, status: string) {
    await updateInterestSubmission(id, { status });
    refresh();
  }

  async function saveNotes(id: string, notes: string) {
    const { error } = await updateInterestSubmission(id, { internal_notes: notes });
    if (error) toast({ title: "Save failed", variant: "destructive" });
    else toast({ title: "Notes saved" });
  }

  // One click from application → invitation with a copyable claim link.
  async function draftInvitation(row: Row, memberType: string) {
    setBusy(true);
    const memberNumber = nextMemberNumber([
      ...entities.map((e) => e.member_number),
      ...invitations.map((i) => i.member_number),
    ]);
    const payload = {
      entity_id: null,
      interest_submission_id: row.id,
      email: row.contact_email || null,
      invitation_code: generateInvitationCode(),
      member_number: memberNumber,
      member_type: memberType,
      status: "drafted",
    };
    const { error } = await createInvitation(payload);
    if (error) {
      setBusy(false);
      return toast({ title: "Invitation failed", description: error.message, variant: "destructive" });
    }
    await updateInterestSubmission(row.id, { status: "invited" });
    navigator.clipboard.writeText(claimUrl(payload.invitation_code));
    setBusy(false);
    toast({
      title: `Invitation drafted · ${memberNumber}`,
      description: "Claim link copied — send it to the creator.",
    });
    refresh();
  }

  async function convertToEntity(row: Row) {
    setBusy(true);
    const number = nextMemberNumber([
      ...entities.map((e) => e.member_number),
      ...invitations.map((i) => i.member_number),
    ]);
    const payload = {
      entity_name: row.entity_name,
      slug: slugify(row.entity_name),
      creator_studio_name: row.creator_studio_name,
      country_region: row.country_region,
      category: row.category,
      bio: row.short_bio,
      official_image_url: row.official_image_url,
      logo_url: row.logo_url,
      year_launched: row.year_launched,
      follower_count: row.follower_count,
      member_type: AIPF_MEMBER_TYPES[1],
      member_number: number,
      founding_cohort: true,
      verification_status: "identity_reviewed",
      published: false,
    };
    const { error } = await upsertEntity(payload);
    setBusy(false);
    if (error) return toast({ title: "Convert failed", description: error.message, variant: "destructive" });
    await updateInterestSubmission(row.id, { status: "approved_directory" });
    toast({ title: "Converted to directory", description: `${number} — review and publish it.` });
    refresh();
  }

  return (
    <AdminLayout>
      <SectionLabel>Submissions</SectionLabel>
      <h1 className="font-institutional text-4xl mt-2">Applications</h1>
      <GoldDivider className="my-6" />

      <div className="flex flex-wrap gap-2">
        {[{ key: "all", label: "All" }, ...PIPELINE].map((p) => (
          <button
            key={p.key}
            onClick={() => setTab(p.key)}
            className={`px-4 py-2 text-xs uppercase tracking-[0.14em] border ${
              tab === p.key
                ? "bg-[hsl(var(--foundation-navy))] text-white border-[hsl(var(--foundation-navy))]"
                : "border-border hover:bg-[hsl(var(--soft-cream))]"
            }`}
          >
            {p.label} · {counts[p.key] ?? 0}
          </button>
        ))}
      </div>

      <div className="mt-6 grid lg:grid-cols-[1fr_440px] gap-8 items-start">
        <div className="aipf-frame overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--soft-cream))]">
              <tr className="text-left text-xs uppercase tracking-[0.14em]">
                <th className="p-3 w-12"></th>
                <th className="p-3">Entity</th>
                <th className="p-3">Category</th>
                <th className="p-3">Country</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Nothing in this stage.</td></tr>
              ) : visible.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`border-t border-border cursor-pointer hover:bg-[hsl(var(--soft-cream))]/60 ${selectedId === r.id ? "bg-[hsl(var(--soft-cream))]" : ""}`}
                >
                  <td className="p-2">
                    <div className="w-9 h-12 bg-[hsl(var(--soft-cream))] border border-border overflow-hidden">
                      {r.official_image_url && (
                        <img src={r.official_image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      )}
                    </div>
                  </td>
                  <td className="p-3 font-medium">{r.entity_name}<div className="text-xs text-muted-foreground font-normal">{r.creator_studio_name}</div></td>
                  <td className="p-3 text-xs">{r.category}</td>
                  <td className="p-3 text-xs">{r.country_region}</td>
                  <td className="p-3 text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3"><ReviewStatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected ? (
          <DetailPanel
            key={selected.id}
            row={selected}
            invitation={invitationFor(selected.id)}
            busy={busy}
            onStatus={(s) => changeStatus(selected.id, s)}
            onNotes={(n) => saveNotes(selected.id, n)}
            onInvite={(mt) => draftInvitation(selected, mt)}
            onConvert={() => convertToEntity(selected)}
          />
        ) : (
          <div className="aipf-frame p-8 text-center text-sm text-muted-foreground">
            Select an application to review it.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function DetailPanel({
  row, invitation, busy, onStatus, onNotes, onInvite, onConvert,
}: {
  row: Row;
  invitation?: Row;
  busy: boolean;
  onStatus: (s: string) => void;
  onNotes: (n: string) => void;
  onInvite: (memberType: string) => void;
  onConvert: () => void;
}) {
  const [notes, setNotes] = useState(row.internal_notes || "");
  const [memberType, setMemberType] = useState<string>(AIPF_MEMBER_TYPES[0]);
  const links = (row.additional_links || "").split("\n").filter(Boolean);

  return (
    <div className="aipf-frame p-6 space-y-5 sticky top-6">
      <div className="flex gap-4">
        <div className="w-24 aspect-[3/4] shrink-0 bg-[hsl(var(--soft-cream))] border border-border overflow-hidden">
          {row.official_image_url && <img src={row.official_image_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="min-w-0">
          <SectionLabel>{row.category || "—"}</SectionLabel>
          <h2 className="font-institutional text-2xl mt-1 leading-tight">{row.entity_name}</h2>
          <p className="text-xs text-muted-foreground mt-1">{row.creator_studio_name} · {row.country_region}</p>
          <div className="mt-2 flex items-center gap-2">
            <ReviewStatusBadge status={row.status} />
            {row.founding_cohort && null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <Meta l="Contact">{row.contact_name}<br />{row.contact_email}</Meta>
        <Meta l="Launched / followers">{row.year_launched || "—"} · {row.follower_count || "—"}</Meta>
      </div>

      <div className="text-xs space-y-1">
        <div className="aipf-label !text-[0.6rem] mb-1">Links</div>
        <a href={row.main_platform_link} target="_blank" rel="noreferrer" className="aipf-link block truncate">
          {row.main_platform_link}
        </a>
        {links.map((l: string, i: number) => <div key={i} className="truncate text-muted-foreground">{l}</div>)}
      </div>

      <Collapsible label="Bio">{row.short_bio}</Collapsible>
      <Collapsible label="Why include">{row.why_include}</Collapsible>
      {row.ai_native_explanation && <Collapsible label="AI-native">{row.ai_native_explanation}</Collapsible>}

      <div className="border-t border-border pt-4 space-y-3">
        <div className="aipf-label !text-[0.62rem]">Move stage</div>
        <select
          value={row.status}
          onChange={(e) => onStatus(e.target.value)}
          className="w-full text-xs border p-2 bg-background"
        >
          {AIPF_SUBMISSION_STATUSES.map((s) => <option key={s} value={s}>{s.split("_").join(" ")}</option>)}
        </select>

        {invitation ? (
          <div className="text-xs border border-[hsl(var(--ceremonial-gold))] p-3">
            <div className="aipf-label !text-[0.6rem] mb-1">Invitation</div>
            <div className="font-mono">{invitation.invitation_code}</div>
            <div className="text-muted-foreground mt-0.5">{invitation.member_number} · {invitation.status}</div>
            <button
              className="aipf-link mt-2"
              onClick={() => {
                navigator.clipboard.writeText(claimUrl(invitation.invitation_code));
                toast({ title: "Claim link copied" });
              }}
            >
              Copy claim link
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <select
              value={memberType}
              onChange={(e) => setMemberType(e.target.value)}
              className="flex-1 text-xs border p-2 bg-background"
            >
              {AIPF_MEMBER_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <Button size="sm" disabled={busy} onClick={() => onInvite(memberType)}>
              Draft invitation
            </Button>
          </div>
        )}

        <Button variant="outline" size="sm" className="w-full" disabled={busy} onClick={onConvert}>
          Convert to directory entity (manual path)
        </Button>
      </div>

      <div className="border-t border-border pt-4">
        <div className="aipf-label !text-[0.62rem] mb-1">Internal notes</div>
        <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button className="mt-2" size="sm" variant="outline" onClick={() => onNotes(notes)}>Save notes</Button>
      </div>
    </div>
  );
}

function Meta({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="aipf-label !text-[0.6rem] mb-0.5">{l}</div>
      <div className="break-words">{children}</div>
    </div>
  );
}

function Collapsible({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-xs">
      <button onClick={() => setOpen(!open)} className="aipf-label !text-[0.6rem] flex items-center gap-1">
        {label} <span className="text-muted-foreground">{open ? "▾" : "▸"}</span>
      </button>
      {open && <p className="mt-1.5 text-foreground/80 whitespace-pre-wrap">{children}</p>}
    </div>
  );
}
