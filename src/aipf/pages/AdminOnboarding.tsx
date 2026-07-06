import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/aipf/admin/AdminShell";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { ReviewStatusBadge } from "@/aipf/components/Directory";
import { listOnboardingSubmissions, approveOnboarding, rejectOnboarding } from "@/aipf/services";
import type { AipfOnboardingSubmission } from "@/aipf/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

export default function AdminOnboarding() {
  const [rows, setRows] = useState<AipfOnboardingSubmission[]>([]);
  const [selected, setSelected] = useState<AipfOnboardingSubmission | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [working, setWorking] = useState(false);

  async function refresh() {
    const data = await listOnboardingSubmissions();
    setRows(data);
    if (selected) setSelected(data.find((r) => r.id === selected.id) || null);
  }
  useEffect(() => { refresh(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  async function approve(row: AipfOnboardingSubmission) {
    setWorking(true);
    const res = await approveOnboarding(row.id);
    setWorking(false);
    if (!res.ok) {
      toast({ title: "Approval failed", description: ("error" in res && res.error) || "Unknown error", variant: "destructive" });
      return;
    }
    toast({ title: "Member published", description: `${res.member_number} · /aipf/directory/${res.slug}` });
    refresh();
  }

  async function reject(row: AipfOnboardingSubmission) {
    setWorking(true);
    const { error } = await rejectOnboarding(row.id, rejectNote);
    setWorking(false);
    if (error) {
      toast({ title: "Reject failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Submission rejected" });
    setRejectNote("");
    refresh();
  }

  const pending = rows.filter((r) => r.status === "submitted");
  const resolved = rows.filter((r) => r.status !== "submitted");

  return (
    <AdminLayout>
      <SectionLabel>Membership</SectionLabel>
      <h1 className="font-institutional text-4xl mt-2">Onboarding Review</h1>
      <GoldDivider className="my-6" />
      <p className="text-sm text-muted-foreground max-w-2xl">
        Completed claim submissions — each one has confirmed its profile, accepted the principles,
        and signed the digital oath. Approving publishes the member in the directory and assigns the
        member number.
      </p>

      <div className="mt-8 grid lg:grid-cols-[1fr_420px] gap-8 items-start">
        <div className="space-y-8 min-w-0">
          <SubmissionTable title={`Pending (${pending.length})`} rows={pending} selected={selected} onSelect={setSelected} />
          <SubmissionTable title={`Resolved (${resolved.length})`} rows={resolved} selected={selected} onSelect={setSelected} />
        </div>

        {selected ? (
          <div className="aipf-frame p-6 space-y-4 sticky top-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <SectionLabel>Submission</SectionLabel>
                <h2 className="font-institutional text-2xl mt-1">{selected.entity_name}</h2>
              </div>
              <ReviewStatusBadge status={selected.status} />
            </div>
            <DetailGrid sub={selected} />
            {selected.links && selected.links.length > 0 && (
              <div>
                <div className="aipf-label mb-2">Links</div>
                <ul className="space-y-1 text-xs">
                  {selected.links.map((l, i) => (
                    <li key={i} className="truncate">
                      <span className="text-muted-foreground uppercase tracking-wide mr-2">{l.platform || "link"}</span>
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="aipf-link">{l.url}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="border-t border-border pt-4">
              <div className="aipf-label mb-1">Digital oath</div>
              <div className="font-institutional italic text-xl">{selected.oath_signature}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Signed {selected.oath_signed_at ? new Date(selected.oath_signed_at).toLocaleString() : "—"} ·
                Principles {selected.accepted_principles ? "accepted" : "NOT accepted"}
              </div>
            </div>

            {selected.status === "submitted" && (
              <div className="border-t border-border pt-4 space-y-3">
                <Button className="w-full" disabled={working} onClick={() => approve(selected)}>
                  {working ? "Working…" : "Approve & publish member"}
                </Button>
                <Textarea
                  rows={2}
                  placeholder="Rejection note (internal)…"
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                />
                <Button variant="outline" className="w-full" disabled={working} onClick={() => reject(selected)}>
                  Reject
                </Button>
              </div>
            )}
            {selected.status === "approved" && selected.entity_id && (
              <Link to="/aipf/admin/directory" className="text-xs aipf-link block">
                Open in Directory admin →
              </Link>
            )}
            {selected.internal_notes && (
              <p className="text-xs text-muted-foreground border-t border-border pt-3">
                Notes: {selected.internal_notes}
              </p>
            )}
          </div>
        ) : (
          <div className="aipf-frame p-8 text-center text-sm text-muted-foreground">
            Select a submission to review it.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function SubmissionTable({
  title, rows, selected, onSelect,
}: {
  title: string;
  rows: AipfOnboardingSubmission[];
  selected: AipfOnboardingSubmission | null;
  onSelect: (r: AipfOnboardingSubmission) => void;
}) {
  return (
    <div>
      <h2 className="font-institutional text-2xl">{title}</h2>
      <div className="mt-3 aipf-frame overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--soft-cream))]">
            <tr className="text-left text-xs uppercase tracking-[0.14em]">
              <th className="p-3">Entity</th>
              <th className="p-3">Category</th>
              <th className="p-3">Signed</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Nothing here.</td></tr>
            ) : rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => onSelect(r)}
                className={`border-t border-border cursor-pointer hover:bg-[hsl(var(--soft-cream))]/60 ${selected?.id === r.id ? "bg-[hsl(var(--soft-cream))]" : ""}`}
              >
                <td className="p-3 font-medium">{r.entity_name}</td>
                <td className="p-3 text-xs">{r.category || "—"}</td>
                <td className="p-3 text-xs">{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                <td className="p-3"><ReviewStatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetailGrid({ sub }: { sub: AipfOnboardingSubmission }) {
  const items: [string, string | number | null][] = [
    ["Creator / studio", sub.creator_studio_name],
    ["Category", sub.category],
    ["Country / region", sub.country_region],
    ["Launched", sub.year_launched],
    ["Followers", sub.follower_count],
    ["Contact", sub.contact_email],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      {items.filter(([, v]) => v).map(([k, v]) => (
        <div key={k}>
          <div className="aipf-label mb-0.5 !text-[0.6rem]">{k}</div>
          <div className="text-xs break-words">{v}</div>
        </div>
      ))}
      {sub.bio && (
        <div className="col-span-2">
          <div className="aipf-label mb-0.5 !text-[0.6rem]">Bio</div>
          <p className="text-xs text-foreground/80 whitespace-pre-wrap">{sub.bio}</p>
        </div>
      )}
    </div>
  );
}
