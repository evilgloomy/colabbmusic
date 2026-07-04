import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/aipf/admin/AdminShell";
import {
  listAllEntities, upsertEntity, deleteEntity, getEntityById,
  listLinksForEntity, upsertLink, deleteLink,
} from "@/aipf/services";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { AIPF_CATEGORIES, AIPF_MEMBER_TYPES, AIPF_VERIFICATION_STATUSES, AIPF_LINK_STATUSES } from "@/aipf/lib/constants";
import { slugify } from "@/aipf/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { AipfEntity, AipfEntityLink } from "@/aipf/types";

export function AdminDirectory() {
  const [rows, setRows] = useState<AipfEntity[]>([]);
  useEffect(() => { listAllEntities().then(setRows); }, []);
  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <SectionLabel>Registry</SectionLabel>
          <h1 className="font-institutional text-4xl mt-2">Directory Entries</h1>
        </div>
        <Link to="/aipf/admin/directory/new" className="px-4 py-2 text-xs uppercase tracking-[0.14em] bg-[hsl(var(--foundation-navy))] text-white">
          New entry
        </Link>
      </div>
      <GoldDivider className="my-6" />
      <div className="aipf-frame overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--soft-cream))]">
            <tr className="text-left text-xs uppercase tracking-[0.14em]">
              <th className="p-3">Entity</th>
              <th className="p-3">Member #</th>
              <th className="p-3">Category</th>
              <th className="p-3">Country</th>
              <th className="p-3">Cohort</th>
              <th className="p-3">Verification</th>
              <th className="p-3">Published</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No entries yet.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3 font-medium">{r.entity_name}<div className="text-xs text-muted-foreground">/{r.slug}</div></td>
                <td className="p-3 text-xs">{r.member_number || "—"}</td>
                <td className="p-3">{r.category}</td>
                <td className="p-3">{r.country_region}</td>
                <td className="p-3">{r.founding_cohort ? "★" : "—"}</td>
                <td className="p-3 text-xs">{r.verification_status}</td>
                <td className="p-3">{r.published ? "✓" : "—"}</td>
                <td className="p-3">
                  <Link to={`/aipf/admin/directory/${r.id}`} className="text-xs underline">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export function AdminEntityEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = !id || id === "new";
  const [entity, setEntity] = useState<Partial<AipfEntity>>({
    entity_name: "", slug: "", published: false, founding_cohort: false, verification_status: "unverified",
  });
  const [links, setLinks] = useState<AipfEntityLink[]>([]);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    getEntityById(id!).then((e) => { if (e) setEntity(e); setLoading(false); });
    listLinksForEntity(id!).then(setLinks);
  }, [id, isNew]);

  function set<K extends keyof AipfEntity>(k: K, v: AipfEntity[K]) {
    setEntity((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "entity_name" && (isNew || !prev.slug)) next.slug = slugify(String(v));
      return next;
    });
  }

  async function save() {
    if (!entity.entity_name || !entity.slug) return toast({ title: "Name and slug required", variant: "destructive" });
    const { data, error } = await upsertEntity(entity);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Saved" });
    if (isNew && data?.id) nav(`/aipf/admin/directory/${data.id}`, { replace: true });
  }

  async function removeEntity() {
    if (!id || isNew) return;
    if (!confirm("Delete this directory entry? This cannot be undone.")) return;
    const { error } = await deleteEntity(id);
    if (error) return toast({ title: "Delete failed", variant: "destructive" });
    nav("/aipf/admin/directory");
  }

  if (loading) return <AdminLayout><p>Loading…</p></AdminLayout>;

  return (
    <AdminLayout>
      <Link to="/aipf/admin/directory" className="text-xs uppercase tracking-[0.14em] text-muted-foreground">← Directory</Link>
      <SectionLabel className="mt-4">{isNew ? "New" : "Edit"}</SectionLabel>
      <h1 className="font-institutional text-4xl mt-2">{entity.entity_name || "New entry"}</h1>
      <GoldDivider className="my-6" />

      <div className="aipf-frame p-6 grid md:grid-cols-2 gap-4">
        <F l="Entity name *"><Input value={entity.entity_name || ""} onChange={(e) => set("entity_name", e.target.value)} /></F>
        <F l="Slug *"><Input value={entity.slug || ""} onChange={(e) => set("slug", e.target.value)} /></F>
        <F l="Creator / studio"><Input value={entity.creator_studio_name || ""} onChange={(e) => set("creator_studio_name", e.target.value)} /></F>
        <F l="Country / region"><Input value={entity.country_region || ""} onChange={(e) => set("country_region", e.target.value)} /></F>
        <F l="Category">
          <select value={entity.category || ""} onChange={(e) => set("category", e.target.value)} className="h-10 w-full px-3 border border-input bg-background text-sm">
            <option value="">—</option>
            {AIPF_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </F>
        <F l="Member type">
          <select value={entity.member_type || ""} onChange={(e) => set("member_type", e.target.value)} className="h-10 w-full px-3 border border-input bg-background text-sm">
            <option value="">—</option>
            {AIPF_MEMBER_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </F>
        <F l="Member number"><Input value={entity.member_number || ""} onChange={(e) => set("member_number", e.target.value)} placeholder="AIPF-2026-001" /></F>
        <F l="Verification">
          <select value={entity.verification_status || "unverified"} onChange={(e) => set("verification_status", e.target.value)} className="h-10 w-full px-3 border border-input bg-background text-sm">
            {AIPF_VERIFICATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </F>
        <F l="Year launched"><Input type="number" value={entity.year_launched ?? ""} onChange={(e) => set("year_launched", e.target.value ? parseInt(e.target.value) : null as any)} /></F>
        <F l="Follower count"><Input value={entity.follower_count || ""} onChange={(e) => set("follower_count", e.target.value)} /></F>
        <F l="Official image URL"><Input value={entity.official_image_url || ""} onChange={(e) => set("official_image_url", e.target.value)} /></F>
        <F l="Logo URL"><Input value={entity.logo_url || ""} onChange={(e) => set("logo_url", e.target.value)} /></F>
        <div className="md:col-span-2"><F l="Bio"><Textarea rows={4} value={entity.bio || ""} onChange={(e) => set("bio", e.target.value)} /></F></div>
        <div className="md:col-span-2"><F l="Status note (public)"><Textarea rows={2} value={entity.status_note || ""} onChange={(e) => set("status_note", e.target.value)} /></F></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!entity.founding_cohort} onChange={(e) => set("founding_cohort", e.target.checked)} /> Founding Cohort 2026</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!entity.published} onChange={(e) => set("published", e.target.checked)} /> Published</label>
      </div>
      <div className="mt-4 flex gap-3">
        <Button onClick={save}>Save entry</Button>
        {!isNew && <Button variant="destructive" onClick={removeEntity}>Delete</Button>}
      </div>

      {!isNew && (
        <>
          <h2 className="font-institutional text-3xl mt-12">Links</h2>
          <GoldDivider className="my-4" />
          <LinkEditor entityId={id!} links={links} onChange={async () => setLinks(await listLinksForEntity(id!))} />
        </>
      )}
    </AdminLayout>
  );
}

function LinkEditor({ entityId, links, onChange }: { entityId: string; links: AipfEntityLink[]; onChange: () => void }) {
  const [draft, setDraft] = useState<Partial<AipfEntityLink>>({ entity_id: entityId, url: "", platform: "", status: "active", show_publicly: true, priority: 0 });
  async function add() {
    if (!draft.url) return;
    const { error } = await upsertLink({ ...draft, entity_id: entityId });
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    setDraft({ entity_id: entityId, url: "", platform: "", status: "active", show_publicly: true, priority: 0 });
    onChange();
  }
  async function update(id: string, patch: Partial<AipfEntityLink>) {
    await upsertLink({ id, ...patch });
    onChange();
  }
  async function remove(id: string) {
    if (!confirm("Remove link?")) return;
    await deleteLink(id);
    onChange();
  }
  return (
    <div className="space-y-3">
      <div className="aipf-frame p-4 grid md:grid-cols-[1fr_180px_120px_120px_auto] gap-2 items-end">
        <F l="URL"><Input value={draft.url || ""} onChange={(e) => setDraft({ ...draft, url: e.target.value })} /></F>
        <F l="Platform"><Input value={draft.platform || ""} onChange={(e) => setDraft({ ...draft, platform: e.target.value })} placeholder="Instagram, Spotify…" /></F>
        <F l="Status">
          <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as any })} className="h-10 w-full px-2 border text-sm">
            {AIPF_LINK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </F>
        <F l="Priority"><Input type="number" value={draft.priority ?? 0} onChange={(e) => setDraft({ ...draft, priority: parseInt(e.target.value) || 0 })} /></F>
        <Button onClick={add}>Add</Button>
      </div>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.id} className="aipf-frame p-3 grid md:grid-cols-[1fr_140px_140px_100px_auto] gap-2 items-center text-sm">
            <a href={l.url} target="_blank" rel="noreferrer" className="aipf-link truncate">{l.url}</a>
            <div className="text-xs text-muted-foreground">{l.platform}</div>
            <select value={l.status} onChange={(e) => update(l.id, { status: e.target.value as any })} className="text-xs border p-1">
              {AIPF_LINK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={l.is_primary} onChange={(e) => update(l.id, { is_primary: e.target.checked })} /> primary</label>
            <button onClick={() => remove(l.id)} className="text-xs text-destructive">Remove</button>
          </li>
        ))}
        {links.length === 0 && <p className="text-xs text-muted-foreground">No links yet.</p>}
      </ul>
    </div>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-[0.14em]">{l}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
