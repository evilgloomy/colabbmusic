import { useEffect, useState } from "react";
import { AdminLayout } from "@/aipf/admin/AdminShell";
import { getOverviewMetrics, listInterestSubmissions, listNominations, listBrokenLinkReports } from "@/aipf/services";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { ReviewStatusBadge } from "@/aipf/components/Directory";

export default function AdminOverview() {
  const [m, setM] = useState<Record<string, number>>({});
  const [recentInterest, setRecentInterest] = useState<any[]>([]);
  const [recentNoms, setRecentNoms] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  useEffect(() => {
    getOverviewMetrics().then(setM);
    listInterestSubmissions().then((d) => setRecentInterest(d.slice(0, 5)));
    listNominations().then((d) => setRecentNoms(d.slice(0, 5)));
    listBrokenLinkReports().then((d) => setRecentReports(d.slice(0, 5)));
  }, []);

  const cards = [
    ["Interest submissions", m.aipf_interest_submissions],
    ["Nominations", m.aipf_nominations],
    ["Directory entries", m.aipf_entities],
    ["Invitations", m.aipf_invitations],
    ["Broken link reports", m.aipf_broken_link_reports],
    ["Journal posts", m.aipf_journal_posts],
    ["Contact messages", m.aipf_contact_messages],
  ] as const;

  return (
    <AdminLayout>
      <SectionLabel>Overview</SectionLabel>
      <h1 className="font-institutional text-4xl mt-2">Foundation Metrics</h1>
      <GoldDivider className="my-6" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([label, n]) => (
          <div key={label} className="aipf-frame p-5">
            <div className="aipf-label">{label}</div>
            <div className="font-institutional text-4xl mt-2">{n ?? "—"}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-10">
        <RecentBlock title="Latest interest" rows={recentInterest} name="entity_name" status="status" />
        <RecentBlock title="Latest nominations" rows={recentNoms} name="nominee_entity_name" status="status" />
        <RecentBlock title="Broken link reports" rows={recentReports} name="issue_type" status="resolved" />
      </div>
    </AdminLayout>
  );
}

function RecentBlock({ title, rows, name, status }: { title: string; rows: any[]; name: string; status: string }) {
  return (
    <div className="aipf-frame p-5">
      <SectionLabel>{title}</SectionLabel>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground mt-2">No entries yet.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex justify-between gap-2">
              <span className="truncate">{r[name]}</span>
              <ReviewStatusBadge status={String(r[status] ?? "")} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
