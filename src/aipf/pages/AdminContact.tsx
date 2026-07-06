import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/aipf/admin/AdminShell";
import { listContactMessages, resolveContactMessage } from "@/aipf/services";
import { SectionLabel, GoldDivider } from "@/aipf/components/Chrome";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface Row {
  id: string;
  name: string | null;
  email: string | null;
  subject: string | null;
  category: string | null;
  message: string | null;
  resolved: boolean;
  created_at: string;
}

export default function AdminContact() {
  const [rows, setRows] = useState<Row[]>([]);
  const [showResolved, setShowResolved] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  async function refresh() { setRows(await listContactMessages()); }
  useEffect(() => { refresh(); }, []);

  const visible = useMemo(
    () => rows.filter((r) => (showResolved ? true : !r.resolved)),
    [rows, showResolved]
  );

  async function setResolved(id: string, resolved: boolean) {
    const { error } = await resolveContactMessage(id, resolved);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    refresh();
  }

  return (
    <AdminLayout>
      <SectionLabel>Inbox</SectionLabel>
      <h1 className="font-institutional text-4xl mt-2">Contact Messages</h1>
      <GoldDivider className="my-6" />

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {rows.filter((r) => !r.resolved).length} open · {rows.length} total
        </p>
        <label className="text-xs uppercase tracking-[0.14em] flex items-center gap-2">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
          Show resolved
        </label>
      </div>

      <div className="mt-4 aipf-frame divide-y divide-border">
        {visible.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No messages.</div>
        ) : visible.map((r) => (
          <div key={r.id} className={`p-4 ${r.resolved ? "opacity-60" : ""}`}>
            <button className="w-full text-left" onClick={() => setOpenId(openId === r.id ? null : r.id)}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-3 min-w-0">
                  <span className="font-medium truncate">{r.subject || "(no subject)"}</span>
                  <span className="text-xs text-muted-foreground truncate">{r.name} · {r.email}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {r.category && (
                    <span className="px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.14em] border border-border text-muted-foreground">
                      {r.category}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </button>
            {openId === r.id && (
              <div className="mt-3 border-t border-border pt-3">
                <p className="text-sm whitespace-pre-wrap text-foreground/85">{r.message}</p>
                <div className="mt-3 flex gap-3">
                  {r.email && (
                    <a
                      href={`mailto:${r.email}?subject=${encodeURIComponent(`Re: ${r.subject || "your message to AIPF"}`)}`}
                      className="text-xs aipf-link"
                    >
                      Reply by email
                    </a>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setResolved(r.id, !r.resolved)}>
                    {r.resolved ? "Reopen" : "Mark resolved"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
