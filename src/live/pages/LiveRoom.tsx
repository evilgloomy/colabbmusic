import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import LiveLayout from "@/live/LiveLayout";
import LiveColaAvatar from "@/live/components/LiveColaAvatar";
import TranscriptView from "@/live/components/TranscriptView";
import { useLiveSession } from "@/live/lib/useLiveSession";
import { useLiveConversation } from "@/live/lib/useLiveConversation";
import { useLiveAuth } from "@/live/LiveAuthContext";
import type { LiveState } from "@/live/lib/types";

/** Plain, non-technical status for the guest. */
const STATUS: Record<LiveState, string> = {
  IDLE: "Ready",
  CONNECTING: "Connecting",
  LISTENING: "Listening",
  USER_SPEAKING: "Listening",
  FINALIZING_TRANSCRIPT: "Listening",
  AURORA_PROCESSING: "Thinking",
  LEMO_PROCESSING: "Thinking",
  VOICE_CONNECTING: "Thinking",
  COLA_SPEAKING: "Speaking",
  INTERRUPTED: "Listening",
  ERROR: "Paused",
};

export default function LiveRoom() {
  const { sessionId = "" } = useParams();
  const { isStaff } = useLiveAuth();
  const { config, loading, error } = useLiveSession(sessionId);
  const convo = useLiveConversation({ sessionId, config });
  const [simText, setSimText] = useState("");
  const [showTranscript, setShowTranscript] = useState(true);

  const active = convo.state !== "IDLE";
  const speaking = convo.state === "COLA_SPEAKING";
  const listening =
    convo.state === "LISTENING" || convo.state === "USER_SPEAKING" || convo.state === "FINALIZING_TRANSCRIPT";

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
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center px-6 py-10">
        <header className="text-center">
          <p className="live-eyebrow">{config.media_organization || "Private interview"}</p>
          <h1 className="live-display mt-1 text-xl md:text-2xl">{config.title}</h1>
        </header>

        <section className="mt-8 flex w-full flex-col items-center">
          <LiveColaAvatar
            state={convo.state}
            emotion={convo.lemo}
            amplitude={convo.amplitude}
            speaking={speaking}
            listening={listening}
            partialTranscript={convo.partial}
          />

          <p className="live-eyebrow mt-6">{STATUS[convo.state]}</p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {!active ? (
              <button className="live-btn" onClick={() => convo.start()}>Start conversation</button>
            ) : (
              <>
                <button className="live-btn" onClick={() => convo.toggleMute()}>
                  {convo.muted ? "Unmute mic" : "Mute mic"}
                </button>
                <button className="live-btn live-btn-danger" onClick={() => convo.stopCola()}>Interrupt</button>
                <button className="live-btn" onClick={() => convo.stop()}>End</button>
              </>
            )}
          </div>

          {!active && isStaff && (
            <label className="mt-5 flex items-center gap-2 text-xs opacity-50">
              <input
                type="checkbox"
                checked={convo.speechMode === "simulated"}
                onChange={(e) => convo.setSpeechMode(e.target.checked ? "simulated" : "browser")}
              />
              Type instead of speaking (debug)
            </label>
          )}

          {active && convo.canSimulate && (
            <form
              className="mt-5 flex w-full max-w-xl gap-2"
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

          {convo.error && <p className="live-accent mt-5 max-w-xl text-center text-sm">{convo.error}</p>}
        </section>

        <section className="mt-12 w-full border-t live-hairline pt-6">
          <button className="live-eyebrow" onClick={() => setShowTranscript((v) => !v)}>
            Transcript {showTranscript ? "−" : "+"}
          </button>
          {showTranscript && (
            <div className="mt-4">
              <TranscriptView turns={convo.turns} partial={convo.partial} />
            </div>
          )}
        </section>

        {isStaff && (
          <section className="mt-8 w-full border-t live-hairline pt-5 text-center">
            <p className="live-eyebrow live-accent">Rehearsal · staff view</p>
            <div className="mt-3 flex justify-center gap-4 text-xs opacity-60">
              <Link to={`/live/producer/${sessionId}`}>Producer</Link>
              <Link to="/live/sessions">Sessions</Link>
              <button onClick={() => setShowDiag((v) => !v)}>Diagnostics {showDiag ? "−" : "+"}</button>
            </div>
            {showDiag && (
              <dl className="mx-auto mt-4 grid max-w-xl grid-cols-2 gap-x-6 gap-y-2 text-left text-xs opacity-70">
                {(["speech", "aurora", "lemo", "voice", "avatar"] as const).map((k) => (
                  <div key={k} className="contents">
                    <dt className="uppercase tracking-wider">{k}</dt>
                    <dd>
                      {convo.services[k]?.health}
                      {convo.services[k]?.note ? ` · ${convo.services[k]?.note}` : ""}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        )}
      </main>
    </LiveLayout>
  );
}
