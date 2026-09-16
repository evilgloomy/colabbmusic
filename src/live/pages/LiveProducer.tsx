import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import LiveLayout from "@/live/LiveLayout";
import TranscriptView from "@/live/components/TranscriptView";
import { supabase } from "@/integrations/supabase/client";
import { useLiveSession } from "@/live/lib/useLiveSession";
import { useLiveConversation } from "@/live/lib/useLiveConversation";
import { useLiveAuth } from "@/live/LiveAuthContext";
import type { ServiceKey } from "@/live/lib/types";

interface Injection {
  id: string;
  kind: string;
  scope: string;
  content: string;
  active: boolean;
  created_at: string;
}

const SCOPES = ["ONE_TURN", "UNTIL_REMOVED", "ENTIRE_SESSION"];

export default function LiveProducer() {
  const { sessionId = "" } = useParams();
  const { user } = useLiveAuth();
  const { config, brief, loading, error } = useLiveSession(sessionId);
  const convo = useLiveConversation({ sessionId, config, observerOnly: true });
  const db: any = supabase;

  const [injections, setInjections] = useState<Injection[]>([]);
  const [kind, setKind] = useState("private");
  const [scope, setScope] = useState("ONE_TURN");
  const [content, setContent] = useState("");
  const [manual, setManual] = useState("");
  const [exact, setExact] = useState("");
  const [note, setNote] = useState<string | null>(null);

  async function loadInjections() {
    const { data } = await db
      .from("live_context_injections")
      .select("id,kind,scope,content,active,created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });
    setInjections(data || []);
  }

  useEffect(() => {
    if (sessionId) loadInjections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function addInjection(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !user) return;
    const { error: err } = await db.from("live_context_injections").insert({
      session_id: sessionId,
      kind,
      scope,
      content: content.trim(),
      created_by: user.id,
    });
    if (err) setNote(err.message);
    else {
      setContent("");
      loadInjections();
    }
  }

  async function deactivate(id: string) {
    await db.from("live_context_injections").update({ active: false }).eq("id", id);
    loadInjections();
  }

  async function endSession() {
    convo.sendControl({ action: "end_session" });
    await db.from("live_sessions").update({ status: "ended" }).eq("id", sessionId);
    setNote("Session marked as ended.");
  }

  if (loading) {
    return (
      <LiveLayout title="Producer">
        <div className="flex min-h-screen items-center justify-center live-eyebrow">Loading console…</div>
      </LiveLayout>
    );
  }
  if (error || !config) {
    return (
      <LiveLayout title="Producer">
        <div className="flex min-h-screen items-center justify-center text-sm opacity-70">{error || "Not found"}</div>
      </LiveLayout>
    );
  }

  const svc = (k: ServiceKey) => convo.services[k];

  return (
    <LiveLayout title={`Producer · ${config.title}`}>
      <main className="mx-auto w-full max-w-7xl px-6 py-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b live-hairline pb-5">
          <div>
            <p className="live-eyebrow">
              Producer console · engine <span className="live-accent">Aurora Lite</span>
              {convo.mockMode && <span className="live-accent"> · rehearsal</span>}
            </p>
            <h1 className="live-display text-3xl">{config.title}</h1>
          </div>
          <div className="flex gap-2">
            <Link className="live-btn" to={`/live/session/${sessionId}`}>Open room</Link>
            <Link className="live-btn" to="/live">Lobby</Link>
          </div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Left: transcript */}
          <section className="lg:col-span-2 space-y-8">
            <div className="live-panel p-5">
              <div className="flex items-center justify-between">
                <h2 className="live-eyebrow">Live transcript</h2>
                <span className="live-mono live-accent">{convo.state}</span>
              </div>
              <div className="mt-4 max-h-[420px] overflow-y-auto pr-2">
                <TranscriptView turns={convo.turns} partial={convo.partial} dense />
              </div>
            </div>

            <div className="live-panel p-5">
              <h2 className="live-eyebrow">Transport</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="live-btn live-btn-danger" onClick={() => convo.sendControl({ action: "stop_cola" })}>Stop Cola</button>
                <button className="live-btn" onClick={() => convo.sendControl({ action: "cancel_response" })}>Cancel response</button>
                <button className="live-btn" onClick={() => convo.sendControl({ action: "force_listening" })}>Force listening</button>
                <button className="live-btn" onClick={() => convo.sendControl({ action: "mute" })}>Mute mic</button>
                <button className="live-btn" onClick={() => convo.sendControl({ action: "resume" })}>Resume mic</button>
                <button className="live-btn" onClick={() => convo.sendControl({ action: "replay_last" })}>Replay last</button>
                <button className="live-btn" onClick={() => convo.sendControl({ action: "clear_context" })}>Clear context</button>
                <button className="live-btn live-btn-danger" onClick={endSession}>End session</button>
              </div>
              {note && <p className="live-accent mt-3 text-xs">{note}</p>}
            </div>

            <div className="live-panel p-5">
              <h2 className="live-eyebrow">Emergency</h2>
              <form
                className="mt-4 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!manual.trim()) return;
                  convo.sendControl({ action: "manual_response", payload: { text: manual.trim() } });
                  setManual("");
                }}
              >
                <label className="live-eyebrow">Manual response (skips Aurora Lite, keeps LEMO + voice)</label>
                <textarea rows={2} value={manual} onChange={(e) => setManual(e.target.value)} className="live-panel w-full bg-transparent px-3 py-2 text-sm outline-none" />
                <button className="live-btn">Send manual response</button>
              </form>
              <form
                className="mt-5 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!exact.trim()) return;
                  convo.sendControl({ action: "speak_exact", payload: { text: exact.trim() } });
                  setExact("");
                }}
              >
                <label className="live-eyebrow">Speak exact text (skips Aurora Lite and LEMO)</label>
                <textarea rows={2} value={exact} onChange={(e) => setExact(e.target.value)} className="live-panel w-full bg-transparent px-3 py-2 text-sm outline-none" />
                <button className="live-btn live-btn-danger">Speak exact text</button>
              </form>
            </div>

            <div className="live-panel p-5">
              <h2 className="live-eyebrow">Backstage context (never shown to the guest)</h2>
              <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={addInjection}>
                <select value={kind} onChange={(e) => setKind(e.target.value)} className="live-panel bg-transparent px-3 py-2 text-sm outline-none">
                  <option className="text-black" value="private">Private instruction</option>
                  <option className="text-black" value="factual">Factual context</option>
                </select>
                <select value={scope} onChange={(e) => setScope(e.target.value)} className="live-panel bg-transparent px-3 py-2 text-sm outline-none">
                  {SCOPES.map((s) => (
                    <option className="text-black" key={s} value={s}>{s.replace("_", " ")}</option>
                  ))}
                </select>
                <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Instruction or fact…" className="live-panel md:col-span-2 bg-transparent px-3 py-2 text-sm outline-none" />
                <div className="md:col-span-4"><button className="live-btn">Inject</button></div>
              </form>
              <ul className="mt-5 space-y-2">
                {injections.map((i) => (
                  <li key={i.id} className="flex items-start justify-between gap-3 border-b live-hairline pb-2 text-sm">
                    <span>
                      <span className="live-mono live-accent">{i.kind}/{i.scope}</span>{" "}
                      <span className={i.active ? "" : "opacity-40 line-through"}>{i.content}</span>
                    </span>
                    {i.active && (
                      <button className="live-mono live-accent" onClick={() => deactivate(i.id)}>remove</button>
                    )}
                  </li>
                ))}
                {injections.length === 0 && <li className="text-xs opacity-50">No injections.</li>}
              </ul>
            </div>
          </section>

          {/* Right: diagnostics */}
          <aside className="space-y-8">
            <div className="live-panel p-5">
              <h2 className="live-eyebrow">Services</h2>
              <ul className="mt-3 space-y-2 live-mono">
                {([
                  ["speech", "Speech provider"],
                  ["aurora", "Aurora Lite"],
                  ["lemo", "LEMO"],
                  ["voice", "Voice provider"],
                  ["avatar", "Avatar provider"],
                ] as [ServiceKey, string][]).map(([k, label]) => (
                  <li key={k}>
                    <div className="flex items-center justify-between">
                      <span className="opacity-70">{label}</span>
                      <span className={svc(k).health === "down" || svc(k).health === "degraded" ? "live-accent" : ""}>
                        {svc(k).health}
                      </span>
                    </div>
                    {svc(k).note && <p className="opacity-45">{svc(k).note}</p>}
                  </li>
                ))}
              </ul>
            </div>

            <div className="live-panel p-5">
              <h2 className="live-eyebrow">LEMO state</h2>
              {convo.lemo ? (
                <ul className="mt-3 space-y-1 live-mono">
                  <li>emotion: {convo.lemo.emotion}{convo.lemo.is_fallback && " (fallback)"}</li>
                  <li>valence: {convo.lemo.valence}</li>
                  <li>arousal: {convo.lemo.arousal}</li>
                  <li>warmth: {convo.lemo.warmth}</li>
                  <li>confidence: {convo.lemo.confidence}</li>
                  <li>energy: {convo.lemo.energy}</li>
                  <li>rate: {convo.lemo.speaking_rate}</li>
                  <li>pause: {convo.lemo.pause_before_ms}ms</li>
                  <li className="opacity-70">{convo.lemo.delivery_note}</li>
                </ul>
              ) : (
                <p className="mt-3 text-xs opacity-50">No turn yet.</p>
              )}
            </div>

            <div className="live-panel p-5">
              <h2 className="live-eyebrow">Latency (last turn)</h2>
              <ul className="mt-3 space-y-1 live-mono">
                <li>speech final: {convo.latency.speech_finalization_ms ?? "—"} ms</li>
                <li>aurora: {convo.latency.aurora_ms ?? "—"} ms</li>
                <li>lemo: {convo.latency.lemo_ms ?? "—"} ms</li>
                <li>voice TTFA: {convo.latency.voice_ttfa_ms ?? "—"} ms</li>
                <li className="live-accent">total: {convo.latency.total_ms ?? "—"} ms</li>
              </ul>
              {convo.latencyHistory.length > 1 && (
                <p className="mt-3 live-mono opacity-60">
                  avg total:{" "}
                  {Math.round(
                    convo.latencyHistory.reduce((a, b) => a + (b.total_ms || 0), 0) /
                      convo.latencyHistory.filter((s) => s.total_ms).length,
                  )}{" "}
                  ms over {convo.latencyHistory.length} turns
                </p>
              )}
            </div>

            {brief && (
              <div className="live-panel p-5">
                <h2 className="live-eyebrow">Briefing</h2>
                <ul className="mt-3 space-y-2 text-xs">
                  {["topic", "campaign", "talking_points", "topics_to_avoid", "unreleased_info", "approved_announcements", "music_releases", "notes"]
                    .filter((k) => brief[k])
                    .map((k) => (
                      <li key={k}>
                        <span className="live-eyebrow">{k.replace(/_/g, " ")}</span>
                        <p className="opacity-80">{brief[k]}</p>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </main>
    </LiveLayout>
  );
}
