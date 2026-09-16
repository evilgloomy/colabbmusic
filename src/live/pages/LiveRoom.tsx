import { useState } from "react";
import { useParams } from "react-router-dom";
import LiveLayout from "@/live/LiveLayout";
import ColaStage from "@/live/components/ColaStage";
import TranscriptView from "@/live/components/TranscriptView";
import { useLiveSession } from "@/live/lib/useLiveSession";
import { useLiveConversation } from "@/live/lib/useLiveConversation";
import { useLiveAuth } from "@/live/LiveAuthContext";

export default function LiveRoom() {
  const { sessionId = "" } = useParams();
  const { isStaff } = useLiveAuth();
  const { config, loading, error } = useLiveSession(sessionId);
  const convo = useLiveConversation({ sessionId, config });
  const [simText, setSimText] = useState("");

  const active = convo.state !== "IDLE";

  if (loading) {
    return (
      <LiveLayout title="Room">
        <div className="flex min-h-screen items-center justify-center live-eyebrow">Preparing the room…</div>
      </LiveLayout>
    );
  }

  if (error || !config) {
    return (
      <LiveLayout title="Room">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6 text-center text-sm opacity-70">
          {error || "Session unavailable."}
        </div>
      </LiveLayout>
    );
  }

  return (
    <LiveLayout title={config.title}>
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-12">
        <header className="text-center">
          <p className="live-eyebrow">{config.media_organization || "Private interview"}</p>
          <h1 className="live-display mt-2 text-3xl md:text-4xl">{config.title}</h1>
        </header>

        <section className="mt-14 flex flex-col items-center">
          <ColaStage state={convo.state} />

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {!active ? (
              <button className="live-btn" onClick={() => convo.start()}>Start conversation</button>
            ) : (
              <>
                <button className="live-btn" onClick={() => convo.toggleMute()}>
                  {convo.muted ? "Unmute mic" : "Mute mic"}
                </button>
                <button className="live-btn live-btn-danger" onClick={() => convo.stopCola()}>
                  Interrupt Cola
                </button>
                <button className="live-btn" onClick={() => convo.stop()}>End</button>
              </>
            )}
          </div>

          {!active && (
            <label className="mt-6 flex items-center gap-2 text-xs opacity-60">
              <input
                type="checkbox"
                checked={convo.speechMode === "browser"}
                onChange={(e) => convo.setSpeechMode(e.target.checked ? "browser" : "simulated")}
              />
              Use microphone (otherwise type your questions)
            </label>
          )}

          {active && convo.canSimulate && (
            <form
              className="mt-6 flex w-full max-w-xl gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!simText.trim()) return;
                convo.simulateSpeech(simText.trim());
                setSimText("");
              }}
            >
              <input
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                placeholder="Type what you would say…"
                className="live-panel flex-1 bg-transparent px-4 py-3 text-sm outline-none"
              />
              <button className="live-btn" type="submit">Speak</button>
            </form>
          )}

          {convo.error && <p className="live-accent mt-6 max-w-xl text-center text-sm">{convo.error}</p>}
        </section>

        <section className="mt-16 border-t live-hairline pt-8">
          <h2 className="live-eyebrow">Transcript</h2>
          <div className="mt-5">
            <TranscriptView turns={convo.turns} partial={convo.partial} />
          </div>
        </section>

        {isStaff && convo.mockMode && (
          <p className="live-eyebrow mt-10 text-center live-accent">Mock mode — staff view only</p>
        )}
      </main>
    </LiveLayout>
  );
}
