import { useEffect, useState } from "react";
import { AdminLayout } from "@/aipf/admin/AdminShell";
import { listInterestSubmissions, updateInterestSubmission, upsertEntity, listAllEntities } from "@/aipf/services";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { ReviewStatusBadge } from "@/aipf/components/Directory";
import { AIPF_SUBMISSION_STATUSES, AIPF_MEMBER_TYPES } from "@/aipf/lib/constants";
import { slugify, nextMemberNumber } from "@/aipf/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

export default function AdminInterest() {
  const [rows, setRows] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  async function refresh() { setRows(await listInterestSubmissions()); }
  useEffect(() => { refresh(); }, []);

  async function changeStatus(id: string, status: string) {
    await updateInterestSubmission(id, { status });
    refresh();
  }

  async function saveNotes(id: string, notes: string) {
    const { error } = await updateInterestSubmission(id, { internal_notes: notes });
    if (error) toast({ title: "Save failed", variant: "destructive" });
    else toast({ title: "Notes saved" });
  }

  async function convertToEntity(row: any) {
    const existing = await listAllEntities();
    const number = nextMemberNumber(existing.map((e) => e.member_number));
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
    const { data, error } = await upsertEntity(payload);
    if (error) return toast({ title: "Convert failed", description: error.message, variant: "destructive" });
    await updateInterestSubmission(row.id, { status: "approved_directory" });
    toast({ title: "Converted to directory", description: `${number} — review and publish it.` });
    refresh();
  }

  return (
    <AdminLayout>
      <SectionLabel>Submissions</SectionLabel>
      <h1 className="font-institutional text-4xl mt-2">Interest Submissions</h1>
      <GoldDivider className="my-6" />
      <div className="aipf-frame overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--soft-cream))]">
            <tr className="text-left text-xs uppercase tracking-[0.14em]">
              <th className="p-3">Entity</th>
              <th className="p-3">Creator</th>
              <th className="p-3">Category</th>
              <th className="p-3">Country</th>
              <th className="p-3">Submitted</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No submissions yet.</td></tr>
            ) : rows.map((r) => (
              <>
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 font-medium">{r.entity_name}</td>
                  <td className="p-3">{r.creator_studio_name}</td>
                  <td className="p-3">{r.category}</td>
                  <td className="p-3">{r.country_region}</td>
                  <td className="p-3 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="p-3">
                    <select value={r.status} onChange={(e) => changeStatus(r.id, e.target.value)} className="text-xs border p-1">
                      {AIPF_SUBMISSION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3 whitespace-nowrap space-x-2">
                    <button onClick={() => setOpenId(openId === r.id ? null : r.id)} className="text-xs underline">View</button>
                    <button onClick={() => convertToEntity(r)} className="text-xs underline text-[hsl(var(--foundation-navy))]">Convert</button>
                  </td>
                </tr>
                {openId === r.id && (
                  <tr className="bg-[hsl(var(--soft-cream))/0.5]">
                    <td colSpan={7} className="p-4">
                      <SubmissionDetail row={r} saveNotes={(n) => saveNotes(r.id, n)} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

function SubmissionDetail({ row, saveNotes }: { row: any; saveNotes: (n: string) => void }) {
  const [notes, setNotes] = useState(row.internal_notes || "");
  return (
    <div className="grid md:grid-cols-2 gap-6 text-sm">
      <div className="space-y-2">
        <F l="Contact">{row.contact_name} · {row.contact_email}</F>
        <F l="Main link"><a className="aipf-link" href={row.main_platform_link} target="_blank" rel="noreferrer">{row.main_platform_link}</a></F>
        <F l="Additional links"><pre className="whitespace-pre-wrap text-xs">{row.additional_links || "—"}</pre></F>
        <F l="Year launched">{row.year_launched || "—"}</F>
        <F l="Followers">{row.follower_count || "—"}</F>
      </div>
      <div className="space-y-2">
        <F l="Short bio">{row.short_bio}</F>
        <F l="Why include">{row.why_include}</F>
        <F l="AI native">{row.ai_native_explanation}</F>
        <div>
          <div className="aipf-label mb-1">Internal notes</div>
          <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button className="mt-2" size="sm" onClick={() => saveNotes(notes)}>Save notes</Button>
        </div>
      </div>
    </div>
  );
}
function F({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="aipf-label mb-1">{l}</div>
      <div>{children}</div>
    </div>
  );
}
