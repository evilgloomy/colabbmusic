import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LiveLayout from "@/live/LiveLayout";
import { useLiveAuth } from "@/live/LiveAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LIVE_MOCK_MODE } from "@/live/adapters/registry";

interface SessionRow {
  id: string;
  title: string;
  media_organization: string | null;
  interviewer_name: string | null;
  status: string;
  primary_language: string;
  created_at: string;
}

const FIELDS: { key: string; label: string; area?: boolean }[] = [
  { key: "title", label: "Interview title" },
  { key: "media_organization", label: "Media organization" },
  { key: "interviewer_name", label: "Interviewer name" },
  { key: "topic", label: "Topic" },
  { key: "campaign", label: "Campaign" },
  { key: "talking_points", label: "Talking points", area: true },
  { key: "topics_to_avoid", label: "Topics to avoid", area: true },
  { key: "unreleased_info", label: "Unreleased info (never spoken)", area: true },
  { key: "approved_announcements", label: "Approved announcements", area: true },
  { key: "music_releases", label: "Music releases", area: true },
  { key: "notes", label: "Notes", area: true },
];

export default function LiveLobby() {
  const { user, role, isStaff, signOut } = useLiveAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ title: "", primary_language: "en" });
  const [language, setLanguage] = useState("en");
  const [silence, setSilence] = useState(750);
  const [error, setError] = useState<string | null>(null);

  const db: any = supabase;

  async function load() {
    const { data } = await db
      .from("live_sessions")
      .select("id,title,media_organization,interviewer_name,status,primary_language,created_at")
      .order("created_at", { ascending: false });
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    setError(null);
    const payload: Record<string, unknown> = { created_by: user.id, primary_language: language, silence_threshold_ms: silence, mock_mode: LIVE_MOCK_MODE };
    FIELDS.forEach((f) => {
      const v = form[f.key]?.trim();
      if (v) payload[f.key] = v;
    });
    if (!payload.title) payload.title = "Untitled interview";
    const { data, error: err } = await db.from("live_sessions").insert(payload).select("id").single();
    setCreating(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate(`/live/producer/${data.id}`);
  }

  return (
    <LiveLayout title="Lobby">
      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b live-hairline pb-6">
          <div>
            <p className="live-eyebrow">Cola B · Live</p>
            <h1 className="live-display text-4xl">Interview sessions</h1>
          </div>
          <div className="text-right text-xs opacity-60">
            <p>{user?.email}</p>
            <p className="uppercase tracking-[0.2em]">{role}</p>
            <button className="live-accent mt-2 underline" onClick={() => signOut()}>
              Sign out
            </button>
          </div>
        </header>

        {LIVE_MOCK_MODE && isStaff && (
          <p className="live-panel mt-6 px-4 py-3 text-xs uppercase tracking-[0.2em] live-accent">
            Mock mode — no live providers connected
          </p>
        )}

        <section className="mt-10">
          <h2 className="live-eyebrow">Sessions</h2>
          {loading ? (
            <p className="mt-4 text-sm opacity-60">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="mt-4 text-sm opacity-60">No sessions yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {rows.map((s) => (
                <li key={s.id} className="live-panel flex flex-wrap items-center justify-between gap-3 px-4 py-4">
                  <div>
                    <p className="live-display text-lg">{s.title}</p>
                    <p className="text-xs opacity-60">
                      {[s.media_organization, s.interviewer_name, s.primary_language.toUpperCase(), s.status].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link className="live-btn" to={`/live/session/${s.id}`}>Room</Link>
                    {isStaff && (
                      <Link className="live-btn" to={`/live/producer/${s.id}`}>Producer</Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {isStaff && (
          <section className="mt-14">
            <h2 className="live-eyebrow">New session</h2>
            <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={createSession}>
              {FIELDS.map((f) => (
                <label key={f.key} className={f.area ? "md:col-span-2" : ""}>
                  <span className="live-eyebrow">{f.label}</span>
                  {f.area ? (
                    <textarea
                      rows={2}
                      value={form[f.key] || ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="live-panel mt-2 w-full bg-transparent px-3 py-2 text-sm outline-none"
                    />
                  ) : (
                    <input
                      value={form[f.key] || ""}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="live-panel mt-2 w-full bg-transparent px-3 py-2 text-sm outline-none"
                    />
                  )}
                </label>
              ))}
              <label>
                <span className="live-eyebrow">Primary language</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="live-panel mt-2 w-full bg-transparent px-3 py-2 text-sm outline-none"
                >
                  <option className="text-black" value="en">English</option>
                  <option className="text-black" value="zh">Cantonese</option>
                </select>
              </label>
              <label>
                <span className="live-eyebrow">Silence threshold (ms)</span>
                <input
                  type="number"
                  min={400}
                  max={2000}
                  step={50}
                  value={silence}
                  onChange={(e) => setSilence(Number(e.target.value))}
                  className="live-panel mt-2 w-full bg-transparent px-3 py-2 text-sm outline-none"
                />
              </label>
              {error && <p className="live-accent md:col-span-2 text-sm">{error}</p>}
              <div className="md:col-span-2">
                <button className="live-btn" disabled={creating}>{creating ? "Creating…" : "Create session"}</button>
              </div>
            </form>
          </section>
        )}
      </main>
    </LiveLayout>
  );
}
