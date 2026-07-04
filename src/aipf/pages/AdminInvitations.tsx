import { useEffect, useState } from "react";
import { AdminLayout } from "@/aipf/admin/AdminShell";
import { listInvitations, createInvitation, updateInvitation, listAllEntities } from "@/aipf/services";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { AIPF_INVITATION_STATUSES, AIPF_MEMBER_TYPES } from "@/aipf/lib/constants";
import { generateInvitationCode, invitationCopy, nextMemberNumber } from "@/aipf/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import type { AipfEntity } from "@/aipf/types";

export default function AdminInvitations() {
  const [rows, setRows] = useState<any[]>([]);
  const [entities, setEntities] = useState<AipfEntity[]>([]);
  const [draft, setDraft] = useState({ entity_id: "", email: "", member_type: AIPF_MEMBER_TYPES[0] });
  const [preview, setPreview] = useState<any | null>(null);

  async function refresh() {
    setRows(await listInvitations());
    setEntities(await listAllEntities());
  }
  useEffect(() => { refresh(); }, []);

  async function create() {
    const ent = entities.find((e) => e.id === draft.entity_id);
    if (!ent) return toast({ title: "Pick an entity", variant: "destructive" });
    const memberNumber = ent.member_number || nextMemberNumber(entities.map((e) => e.member_number));
    const payload = {
      entity_id: ent.id,
      email: draft.email || null,
      invitation_code: generateInvitationCode(),
      member_number: memberNumber,
      member_type: draft.member_type,
      status: "drafted",
    };
    const { error } = await createInvitation(payload);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Invitation drafted", description: `${payload.invitation_code} · ${memberNumber}` });
    setDraft({ entity_id: "", email: "", member_type: AIPF_MEMBER_TYPES[0] });
    refresh();
  }

  function copy(row: any) {
    const ent = entities.find((e) => e.id === row.entity_id);
    const text = invitationCopy(ent?.entity_name || "the nominee", row.member_type);
    navigator.clipboard.writeText(`${text}\n\nInvitation code: ${row.invitation_code}\nMember number: ${row.member_number}`);
    toast({ title: "Invitation copied" });
    setPreview({ text, row });
  }

  return (
    <AdminLayout>
      <SectionLabel>Membership</SectionLabel>
      <h1 className="font-institutional text-4xl mt-2">Invitations</h1>
      <GoldDivider className="my-6" />

      <div className="aipf-frame p-6 grid md:grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end">
        <div>
          <Label className="text-xs uppercase tracking-[0.14em]">Entity</Label>
          <select value={draft.entity_id} onChange={(e) => setDraft({ ...draft, entity_id: e.target.value })} className="h-10 w-full px-3 border border-input bg-background text-sm">
            <option value="">Select entity…</option>
            {entities.map((e) => <option key={e.id} value={e.id}>{e.entity_name}</option>)}
          </select>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-[0.14em]">Email</Label>
          <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-[0.14em]">Member type</Label>
          <select value={draft.member_type} onChange={(e) => setDraft({ ...draft, member_type: e.target.value })} className="h-10 w-full px-3 border border-input bg-background text-sm">
            {AIPF_MEMBER_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <Button onClick={create}>Draft invitation</Button>
      </div>

      <div className="mt-8 aipf-frame overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--soft-cream))]">
            <tr className="text-left text-xs uppercase tracking-[0.14em]">
              <th className="p-3">Code</th>
              <th className="p-3">Entity</th>
              <th className="p-3">Member #</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No invitations yet.</td></tr>
            ) : rows.map((r) => {
              const ent = entities.find((e) => e.id === r.entity_id);
              return (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 font-mono text-xs">{r.invitation_code}</td>
                  <td className="p-3">{ent?.entity_name || "—"}</td>
                  <td className="p-3 text-xs">{r.member_number}</td>
                  <td className="p-3 text-xs">{r.member_type}</td>
                  <td className="p-3">
                    <select value={r.status} onChange={async (e) => { await updateInvitation(r.id, { status: e.target.value }); refresh(); }} className="text-xs border p-1">
                      {AIPF_INVITATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <button onClick={() => copy(r)} className="text-xs underline">Copy text</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {preview && (
        <div className="aipf-frame p-6 mt-8">
          <SectionLabel>Invitation preview</SectionLabel>
          <Textarea rows={10} readOnly value={`${preview.text}\n\nInvitation code: ${preview.row.invitation_code}\nMember number: ${preview.row.member_number}`} className="mt-3 font-mono text-xs" />
        </div>
      )}
    </AdminLayout>
  );
}
