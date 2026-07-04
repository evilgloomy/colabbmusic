import { Fragment, useEffect, useState } from "react";
import { AdminLayout } from "@/aipf/admin/AdminShell";
import { listNominations, updateNomination, upsertEntity, listAllEntities } from "@/aipf/services";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { AIPF_NOMINATION_STATUSES, AIPF_MEMBER_TYPES } from "@/aipf/lib/constants";
import { slugify, nextMemberNumber } from "@/aipf/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function AdminNominations() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  async function refresh() { setRows(await listNominations()); }
  useEffect(() => { refresh(); }, []);

  async function changeStatus(id: string, status: string) {
    await updateNomination(id, { status });
    refresh();
  }

  async function convert(row: any) {
    const existing = await listAllEntities();
    const number = nextMemberNumber(existing.map((e) => e.member_number));
    const { error } = await upsertEntity({
      entity_name: row.nominee_entity_name,
      slug: slugify(row.nominee_entity_name),
      creator_studio_name: row.creator_studio_name,
      country_region: row.country_region,
      category: row.category,
      bio: row.why_considered,
      member_type: AIPF_MEMBER_TYPES[5], // Emerging Member
      member_number: number,
      verification_status: "unverified",
      published: false,
    });
    if (error) return toast({ title: "Convert failed", description: error.message, variant: "destructive" });
    await updateNomination(row.id, { status: "invited" });
    toast({ title: "Converted", description: `${number} added to directory (unpublished).` });
    refresh();
  }

  return (
    <AdminLayout>
      <SectionLabel>Discovery</SectionLabel>
      <h1 className="font-institutional text-4xl mt-2">Nominations</h1>
      <GoldDivider className="my-6" />
      <div className="aipf-frame overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--soft-cream))]">
            <tr className="text-left text-xs uppercase tracking-[0.14em]">
              <th className="p-3">Nominee</th>
              <th className="p-3">Category</th>
              <th className="p-3">Nominated by</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No nominations yet.</td></tr>
            ) : rows.map((r) => (
              <Fragment key={r.id}>
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 font-medium">{r.nominee_entity_name}</td>
                  <td className="p-3">{r.category}</td>
                  <td className="p-3 text-xs">{r.nominated_by_name || "—"}</td>
                  <td className="p-3 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <select value={r.status} onChange={(e) => changeStatus(r.id, e.target.value)} className="text-xs border p-1">
                      {AIPF_NOMINATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3 whitespace-nowrap space-x-2">
                    <button onClick={() => setOpen(open === r.id ? null : r.id)} className="text-xs underline">View</button>
                    <button onClick={() => convert(r)} className="text-xs underline text-[hsl(var(--foundation-navy))]">Convert</button>
                  </td>
                </tr>
                {open === r.id && (
                  <tr className="bg-[hsl(var(--soft-cream))/0.5]">
                    <td colSpan={6} className="p-4">
                      <NoteEditor id={r.id} initial={r.internal_notes || ""} />
                      <div className="mt-4 text-sm space-y-2">
                        <div><b>Why:</b> {r.why_considered}</div>
                        <div><b>Links:</b> <pre className="whitespace-pre-wrap text-xs">{r.social_links}</pre></div>
                        {r.supporting_links && <div><b>Supporting:</b> <pre className="whitespace-pre-wrap text-xs">{r.supporting_links}</pre></div>}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

function NoteEditor({ id, initial }: { id: string; initial: string }) {
  const [v, setV] = useState(initial);
  return (
    <div>
      <div className="aipf-label mb-1">Internal notes</div>
      <Textarea rows={3} value={v} onChange={(e) => setV(e.target.value)} />
      <Button size="sm" className="mt-2" onClick={async () => {
        await updateNomination(id, { internal_notes: v });
        toast({ title: "Notes saved" });
      }}>Save notes</Button>
    </div>
  );
}
