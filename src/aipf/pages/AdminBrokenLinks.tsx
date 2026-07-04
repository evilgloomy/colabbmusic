import { useEffect, useState } from "react";
import { AdminLayout } from "@/aipf/admin/AdminShell";
import { listBrokenLinkReports, resolveBrokenLinkReport } from "@/aipf/services";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";

export default function AdminBrokenLinks() {
  const [rows, setRows] = useState<any[]>([]);
  async function refresh() { setRows(await listBrokenLinkReports()); }
  useEffect(() => { refresh(); }, []);
  return (
    <AdminLayout>
      <SectionLabel>Reports</SectionLabel>
      <h1 className="font-institutional text-4xl mt-2">Broken Link Reports</h1>
      <GoldDivider className="my-6" />
      <div className="aipf-frame overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--soft-cream))]">
            <tr className="text-left text-xs uppercase tracking-[0.14em]">
              <th className="p-3">Entity</th>
              <th className="p-3">Issue</th>
              <th className="p-3">Message</th>
              <th className="p-3">Reporter</th>
              <th className="p-3">Date</th>
              <th className="p-3">Resolved</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No reports.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3">{r.aipf_entities?.entity_name || "—"}</td>
                <td className="p-3 text-xs">{r.issue_type}</td>
                <td className="p-3 text-xs max-w-md">{r.message}</td>
                <td className="p-3 text-xs">{r.reporter_email || "—"}</td>
                <td className="p-3 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={!!r.resolved}
                    onChange={async (e) => { await resolveBrokenLinkReport(r.id, e.target.checked); refresh(); }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
