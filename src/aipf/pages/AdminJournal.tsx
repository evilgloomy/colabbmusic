import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/aipf/admin/AdminShell";
import { listAllPosts, getPostById, upsertPost, deletePost } from "@/aipf/services";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { AIPF_JOURNAL_TYPES } from "@/aipf/lib/constants";
import { slugify } from "@/aipf/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { AipfJournalPost } from "@/aipf/types";

export function AdminJournal() {
  const [rows, setRows] = useState<AipfJournalPost[]>([]);
  useEffect(() => { listAllPosts().then(setRows); }, []);
  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <div>
          <SectionLabel>Editorial</SectionLabel>
          <h1 className="font-institutional text-4xl mt-2">Journal</h1>
        </div>
        <Link to="/aipf/admin/journal/new" className="px-4 py-2 text-xs uppercase tracking-[0.14em] bg-[hsl(var(--foundation-navy))] text-white">New post</Link>
      </div>
      <GoldDivider className="my-6" />
      <div className="aipf-frame overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--soft-cream))]">
            <tr className="text-left text-xs uppercase tracking-[0.14em]">
              <th className="p-3">Title</th>
              <th className="p-3">Type</th>
              <th className="p-3">Published</th>
              <th className="p-3">Updated</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No posts.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3">{r.title}<div className="text-xs text-muted-foreground">/{r.slug}</div></td>
                <td className="p-3 text-xs">{r.post_type}</td>
                <td className="p-3">{r.published ? "✓" : "—"}</td>
                <td className="p-3 text-xs">{r.updated_at ? new Date(r.updated_at).toLocaleDateString() : "—"}</td>
                <td className="p-3"><Link to={`/aipf/admin/journal/${r.id}`} className="text-xs underline">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export function AdminJournalEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const isNew = !id || id === "new";
  const [p, setP] = useState<Partial<AipfJournalPost>>({ title: "", slug: "", published: false, post_type: AIPF_JOURNAL_TYPES[0] });
  useEffect(() => { if (!isNew) getPostById(id!).then((x) => x && setP(x)); }, [id, isNew]);

  function set<K extends keyof AipfJournalPost>(k: K, v: AipfJournalPost[K]) {
    setP((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "title" && (isNew || !prev.slug)) next.slug = slugify(String(v));
      return next;
    });
  }

  async function save() {
    if (!p.title || !p.slug) return toast({ title: "Title and slug required", variant: "destructive" });
    const { error } = await upsertPost(p);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Saved" });
    nav("/aipf/admin/journal");
  }
  async function remove() {
    if (isNew || !id) return;
    if (!confirm("Delete post?")) return;
    await deletePost(id);
    nav("/aipf/admin/journal");
  }

  return (
    <AdminLayout>
      <Link to="/aipf/admin/journal" className="text-xs uppercase tracking-[0.14em] text-muted-foreground">← Journal</Link>
      <SectionLabel className="mt-4">{isNew ? "New" : "Edit"} post</SectionLabel>
      <h1 className="font-institutional text-4xl mt-2">{p.title || "New post"}</h1>
      <GoldDivider className="my-6" />
      <div className="aipf-frame p-6 grid md:grid-cols-2 gap-4">
        <div><Label>Title</Label><Input value={p.title || ""} onChange={(e) => set("title", e.target.value)} /></div>
        <div><Label>Slug</Label><Input value={p.slug || ""} onChange={(e) => set("slug", e.target.value)} /></div>
        <div>
          <Label>Type</Label>
          <select value={p.post_type || ""} onChange={(e) => set("post_type", e.target.value)} className="h-10 w-full px-3 border border-input bg-background text-sm">
            {AIPF_JOURNAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <label className="flex items-end gap-2 text-sm"><input type="checkbox" checked={!!p.published} onChange={(e) => set("published", e.target.checked)} /> Published</label>
        <div className="md:col-span-2"><Label>Excerpt</Label><Textarea rows={2} value={p.excerpt || ""} onChange={(e) => set("excerpt", e.target.value)} /></div>
        <div className="md:col-span-2"><Label>Content</Label><Textarea rows={12} value={p.content || ""} onChange={(e) => set("content", e.target.value)} /></div>
      </div>
      <div className="mt-4 flex gap-3">
        <Button onClick={save}>Save</Button>
        {!isNew && <Button variant="destructive" onClick={remove}>Delete</Button>}
      </div>
    </AdminLayout>
  );
}
