import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSpeechAdapter, type SpeechMode } from "@/live/adapters/registry";
import { speechRecognitionSupported } from "@/live/adapters/speech/browserSpeech";
import { createColaSession } from "@/live/runtime";
import { NEUTRAL_LEMO, type LiveSessionConfig, type LiveState, type LemoState, type LatencySample, type TranscriptTurn, type ServiceStatusMap } from "./types";
export interface LiveControlEvent {
  action:
    | "stop_cola"
    | "cancel_response"
    | "force_listening"
    | "mute"
    | "resume"
    | "replay_last"
    | "clear_context"
    | "end_session"
    | "speak_exact"
    | "manual_response";
  payload?: { text?: string; muted?: boolean };
}


const INITIAL_SERVICES: ServiceStatusMap = {
  speech: { health: "unknown" }, aurora: { health: "unknown", note: "Aurora Lite" },
  lemo: { health: "unknown", note: "LEMO Lite" }, voice: { health: "unknown", note: "MiniMax" },
  avatar: { health: "unknown", note: "Shiba Native Avatar" },
};
export function useLiveConversation(opts: { sessionId: string; config: LiveSessionConfig | null; observerOnly?: boolean; speechMode?: SpeechMode }) {
  const { sessionId, config, observerOnly = false } = opts;
  const [speechMode, setSpeechMode] = useState<SpeechMode>(opts.speechMode ?? "browser");
  const [state, setState] = useState<LiveState>("IDLE");
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [partial, setPartial] = useState("");
  const [muted, setMuted] = useState(false);
  const [lemo, setLemo] = useState<LemoState | null>(null);
  const [latency, setLatency] = useState<LatencySample>({});
  const [latencyHistory, setLatencyHistory] = useState<LatencySample[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<ServiceStatusMap>(INITIAL_SERVICES);
  const mic = useMemo(() => getSpeechAdapter(speechMode), [speechMode]);
  const runtime = useMemo(() => createColaSession(sessionId, mic, config?.primary_language, config?.silence_threshold_ms),
    [sessionId, mic, config?.primary_language, config?.silence_threshold_ms]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const controlRef = useRef<(event: LiveControlEvent) => void>(() => {});
  const broadcast = useCallback((event: string, payload: unknown) => {
    if (!observerOnly) void channelRef.current?.send({ type: "broadcast", event, payload });
  }, [observerOnly]);
  const addTurn = useCallback((role: "interviewer" | "cola", content: string, id: string = crypto.randomUUID()) => {
    const turn: TranscriptTurn = { id, role, content, isFinal: true, interrupted: false, createdAt: new Date().toISOString() };
    setTurns(turns => [...turns, turn]); broadcast("turn", turn);
  }, [broadcast]);
  useEffect(() => {
    if (observerOnly) return;
    const unsubscribe = runtime.subscribe(event => {
      switch (event.type) {
        case "state": {
          const next: LiveState = event.state === "THINKING" ? "AURORA_PROCESSING" : event.state === "SPEAKING" ? "COLA_SPEAKING" : event.state;
          setState(next); broadcast("state", { state: next }); break;
        }
        case "session.connected": setServices(s => ({ ...s, speech: { health: speechMode === "simulated" ? "mock" : "ok", note: speechMode } })); break;
        case "user.speech.partial": setPartial(event.text); broadcast("partial", { text: event.text }); break;
        case "user.speech.final": setPartial(""); addTurn("interviewer", event.text); break;
        case "brain.completed":
          addTurn("cola", event.result.reply_text, event.result.response_id);
          setServices(s => ({ ...s, aurora: { health: event.result.mock ? "degraded" : "ok",
            note: `${event.result.provider} · ${event.result.model} · profile ${event.result.metadata?.profile_version ?? "—"}` } })); break;
        case "emotion.updated": setLemo(event.emotion); broadcast("lemo", event.emotion);
          setServices(s => ({ ...s, lemo: { health: event.emotion.is_fallback ? "degraded" : "ok", note: "LEMO Lite" } })); break;
        case "speech.chunk": setServices(s => ({ ...s, voice: { health: "ok", note: "MiniMax Speech 2.8 Turbo" } })); break;
        case "telemetry": setLatency(current => ({ ...current, ...event.metrics }));
          if (event.metrics.total_ms != null) setLatencyHistory(h => [...h.slice(-19), event.metrics]);
          broadcast("latency", event.metrics); break;
        case "session.interrupted": setTurns(current => current.map((t, i) => i === current.length - 1 && t.role === "cola" ? { ...t, interrupted: true } : t)); break;
        case "runtime.error": {
          const messages = { AvatarUnavailable: "", SpeechUnavailable: "Cola’s usual voice is unavailable. Using the backup voice.",
            BrainUnavailable: "Cola could not reply. Please try again.", MicrophoneUnavailable: "The microphone is unavailable. Allow access or use typed input.",
            SessionExpired: "Please sign in again.", NetworkUnavailable: "Connection lost. Please try again." };
          if (messages[event.error.code]) setError(messages[event.error.code]);
          if (event.error.code === "SpeechUnavailable") setServices(s => ({ ...s, voice: { health: "degraded", note: "Browser TTS emergency fallback" } }));
          break;
        }
      }
    });
    const avatarUnsubscribe = runtime.options.avatar.subscribe(() => {
      const status = runtime.options.avatar.getStatus();
      const metrics = Object.entries(status.metrics ?? {}).map(([key, value]) => `${key}: ${value ?? "unmeasured"}`).join(" · ");
      setServices(s => ({ ...s, avatar: { health: status.streamReady ? "ok" : "degraded",
        note: `Shiba Native Avatar · ${status.status}${metrics ? ` · ${metrics}` : ""}` } }));
    });
    return () => { unsubscribe(); avatarUnsubscribe(); void runtime.stop(); };
  }, [runtime, observerOnly, addTurn, broadcast, speechMode]);
  useEffect(() => { broadcast("services", services); }, [services, broadcast]);
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase.channel(`live-room-${sessionId}`, { config: { broadcast: { self: false } } });
    channel.on("broadcast", { event: "state" }, ({ payload }) => { if (observerOnly) setState(payload.state); })
      .on("broadcast", { event: "turn" }, ({ payload }) => { if (observerOnly) setTurns(t => [...t, payload]); })
      .on("broadcast", { event: "partial" }, ({ payload }) => { if (observerOnly) setPartial(payload.text); })
      .on("broadcast", { event: "lemo" }, ({ payload }) => { if (observerOnly) setLemo(payload); })
      .on("broadcast", { event: "latency" }, ({ payload }) => { if (observerOnly) { setLatency(p => ({ ...p, ...payload })); setLatencyHistory(h => [...h.slice(-19), payload]); } })
      .on("broadcast", { event: "services" }, ({ payload }) => { if (observerOnly) setServices(payload); })
      .on("broadcast", { event: "control" }, ({ payload }) => { if (!observerOnly) controlRef.current(payload); }).subscribe();
    channelRef.current = channel;
    return () => { void supabase.removeChannel(channel); channelRef.current = null; };
  }, [sessionId, observerOnly]);
  const handleControl = (event: LiveControlEvent) => {
    switch (event.action) {
      case "stop_cola": case "cancel_response": runtime.interrupt(); break;
      case "force_listening": runtime.interrupt(); runtime.setMuted(false); setMuted(false); break;
      case "mute": runtime.setMuted(true); setMuted(true); break;
      case "resume": runtime.setMuted(false); setMuted(false); break;
      case "replay_last": runtime.replay(); break;
      case "clear_context": runtime.clearHistory(); setTurns([]); setPartial(""); break;
      case "end_session": void runtime.stop(); break;
      case "speak_exact": case "manual_response": if (event.payload?.text) {
        addTurn("cola", event.payload.text); void runtime.say(event.payload.text, lemo ?? NEUTRAL_LEMO);
      } break;
    }
  };
  controlRef.current = handleControl;
  const sendControl = (event: LiveControlEvent) => {
    void channelRef.current?.send({ type: "broadcast", event: "control", payload: event });
    if (!observerOnly) handleControl(event);
  };
  return { state, turns, partial, muted, amplitude: 0, lemo, latency, latencyHistory, services, error,
    speechMode, canSimulate: speechMode === "simulated", mockMode: false, setSpeechMode,
    avatar: runtime.options.avatar,
    start: async () => {
      if (observerOnly) return; setError(null);
      if (speechMode === "browser" && !speechRecognitionSupported()) { setSpeechMode("simulated"); setError("Live listening is unavailable. Select Start again to use typed input."); return; }
      await runtime.start();
    },
    stop: () => runtime.stop(), toggleMute: () => { runtime.setMuted(!muted); setMuted(!muted); },
    stopCola: () => sendControl({ action: "stop_cola" }), sendControl,
    simulateSpeech: (text: string) => mic.simulate?.(text), clearError: () => setError(null),
  };
}
