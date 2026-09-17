import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getAuroraAdapter,
  getLemoAdapter,
  getSpeechAdapter,
  getVoiceAdapter,
  AURORA_ENGINE_LABEL,
  AVATAR_PROVIDER_LABEL,
  VOICE_PROVIDER_LABEL,
  VOICESTUDIO_STATUS_NOTE,
  LIVE_MOCK_MODE,
  type SpeechMode,
} from "@/live/adapters/registry";
import { speechRecognitionSupported } from "@/live/adapters/speech/browserSpeech";
import {
  NEUTRAL_LEMO,
  type LatencySample,
  type LemoState,
  type LiveSessionConfig,
  type LiveState,
  type ServiceStatusMap,
  type TranscriptTurn,
} from "@/live/lib/types";

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

const uid = () => Math.random().toString(36).slice(2);

export function useLiveConversation(opts: {
  sessionId: string;
  config: LiveSessionConfig | null;
  /** Producer consoles observe only; the guest room runs the engine. */
  observerOnly?: boolean;
  speechMode?: SpeechMode;
}) {
  const { sessionId, config, observerOnly = false } = opts;
  // Microphone is the normal mode. Typed input is a staff/debug fallback only.
  const [speechMode, setSpeechMode] = useState<SpeechMode>(opts.speechMode ?? "browser");
  const [state, setState] = useState<LiveState>("IDLE");
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [partial, setPartial] = useState("");
  const [muted, setMuted] = useState(false);
  const [lemo, setLemo] = useState<LemoState | null>(null);
  const [latency, setLatency] = useState<LatencySample>({});
  const [latencyHistory, setLatencyHistory] = useState<LatencySample[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [amplitude, setAmplitude] = useState(0);
  const [services, setServices] = useState<ServiceStatusMap>({
    speech: { health: "unknown" },
    aurora: { health: "unknown", note: AURORA_ENGINE_LABEL },
    lemo: { health: LIVE_MOCK_MODE ? "mock" : "unknown", note: "LEMO Lite" },
    voice: { health: "mock", note: `${VOICE_PROVIDER_LABEL} · ${VOICESTUDIO_STATUS_NOTE}` },
    avatar: { health: "ok", note: AVATAR_PROVIDER_LABEL },
  });

  const speechRef = useRef(getSpeechAdapter(speechMode));
  const auroraRef = useRef(getAuroraAdapter());
  const lemoRef = useRef(getLemoAdapter());
  const voiceRef = useRef(getVoiceAdapter());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const stateRef = useRef<LiveState>("IDLE");
  const lastReplyRef = useRef<{ text: string; lemo: LemoState } | null>(null);
  const interruptedRef = useRef(false);
  const turnsRef = useRef<TranscriptTurn[]>([]);
  const speechEndRef = useRef(0);
  const startedRef = useRef(false);

  turnsRef.current = turns;

  const broadcast = useCallback((event: string, payload: unknown) => {
    channelRef.current?.send({ type: "broadcast", event, payload });
  }, []);

  const go = useCallback(
    (next: LiveState) => {
      stateRef.current = next;
      setState(next);
      if (!observerOnly) broadcast("state", { state: next });
    },
    [broadcast, observerOnly],
  );

  const addTurn = useCallback(
    (turn: TranscriptTurn) => {
      setTurns((t) => [...t, turn]);
      if (!observerOnly) broadcast("turn", turn);
    },
    [broadcast, observerOnly],
  );

  /* ------------------------------- realtime ------------------------------- */
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase.channel(`live-room-${sessionId}`, {
      config: { broadcast: { self: false } },
    });
    channel
      .on("broadcast", { event: "state" }, ({ payload }) => {
        if (observerOnly) {
          stateRef.current = payload.state;
          setState(payload.state);
        }
      })
      .on("broadcast", { event: "turn" }, ({ payload }) => {
        if (observerOnly) setTurns((t) => [...t, payload as TranscriptTurn]);
      })
      .on("broadcast", { event: "partial" }, ({ payload }) => {
        if (observerOnly) setPartial(payload.text);
      })
      .on("broadcast", { event: "lemo" }, ({ payload }) => {
        if (observerOnly) setLemo(payload as LemoState);
      })
      .on("broadcast", { event: "latency" }, ({ payload }) => {
        if (observerOnly) {
          setLatency(payload as LatencySample);
          setLatencyHistory((h) => [...h.slice(-19), payload as LatencySample]);
        }
      })
      .on("broadcast", { event: "services" }, ({ payload }) => {
        if (observerOnly) setServices(payload as ServiceStatusMap);
      })
      .on("broadcast", { event: "control" }, ({ payload }) => {
        if (!observerOnly) handleControl(payload as LiveControlEvent);
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, observerOnly]);

  useEffect(() => {
    if (!observerOnly) broadcast("services", services);
  }, [services, broadcast, observerOnly]);

  /* --------------------- outgoing audio level for the avatar -------------------- */
  useEffect(() => {
    if (observerOnly || state !== "COLA_SPEAKING") {
      setAmplitude(0);
      return;
    }
    let raf = 0;
    const tick = () => {
      setAmplitude(voiceRef.current.getAmplitude?.() ?? 0);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state, observerOnly]);

  /* -------------------------------- speaking ------------------------------- */
  const speak = useCallback(
    async (text: string, emotion: LemoState, turnStarted: number, partialLatency: LatencySample) => {
      lastReplyRef.current = { text, lemo: emotion };
      go("VOICE_CONNECTING");
      const voiceStart = performance.now();
      let ttfa: number | undefined;
      await voiceRef.current.speak(
        { text, voice_id: "cola_b_primary", lemo: emotion, stream: true, language: config?.primary_language },
        {
          onFirstAudio: () => {
            ttfa = Math.round(performance.now() - voiceStart);
            const sample: LatencySample = {
              ...partialLatency,
              voice_ttfa_ms: ttfa,
              total_ms: Math.round(performance.now() - turnStarted),
            };
            setLatency(sample);
            setLatencyHistory((h) => [...h.slice(-19), sample]);
            if (!observerOnly) broadcast("latency", sample);
            go("COLA_SPEAKING");
          },
          onDone: () => {
            if (stateRef.current === "COLA_SPEAKING" || stateRef.current === "VOICE_CONNECTING") {
              go(startedRef.current ? "LISTENING" : "IDLE");
            }
          },
          onError: (msg) => {
            setServices((s) => ({ ...s, voice: { health: "degraded", note: msg } }));
            setError(`Voice playback failed — the reply text is still in the transcript. ${msg}`);
            go(startedRef.current ? "LISTENING" : "IDLE");
          },
        },
      );
    },
    [broadcast, config?.primary_language, go, observerOnly],
  );

  /* --------------------------------- a turn -------------------------------- */
  const runTurn = useCallback(
    async (userText: string, finalizationMs: number) => {
      const turnStarted = speechEndRef.current || performance.now();
      addTurn({
        id: uid(),
        role: "interviewer",
        content: userText,
        isFinal: true,
        interrupted: false,
        createdAt: new Date().toISOString(),
      });
      setPartial("");
      go("AURORA_PROCESSING");

      let sample: LatencySample = { speech_finalization_ms: finalizationMs };
      try {
        const history = turnsRef.current.slice(-12).map((t) => ({ role: t.role, content: t.content }));
        const auroraStart = performance.now();
        const result = await auroraRef.current.generate({
          session_id: sessionId,
          character_id: "cola_b",
          mode: "live_interview",
          user_text: userText,
          conversation_history: history,
          interrupted_previous_turn: interruptedRef.current,
          speech_finalization_ms: finalizationMs,
        });
        interruptedRef.current = false;
        sample = {
          ...sample,
          aurora_ms: result.latency?.aurora_ms ?? Math.round(performance.now() - auroraStart),
        };
        setServices((s) => ({
          ...s,
          aurora: {
            health: result.mock ? "mock" : "ok",
            note: `${AURORA_ENGINE_LABEL}${result.mock ? " · fallback replies" : ""}`,
          },
        }));

        go("LEMO_PROCESSING");
        let emotion = result.lemo;
        const lemoStart = performance.now();
        if (!emotion) {
          try {
            emotion = await lemoRef.current.analyze({
              session_id: sessionId,
              user_text: userText,
              reply_text: result.reply_text,
            });
            setServices((s) => ({ ...s, lemo: { health: "mock" } }));
          } catch {
            emotion = { ...NEUTRAL_LEMO };
            setServices((s) => ({ ...s, lemo: { health: "degraded", note: "Neutral fallback in use" } }));
          }
        }
        sample = { ...sample, lemo_ms: result.latency?.lemo_ms ?? Math.round(performance.now() - lemoStart) };
        setLemo(emotion);
        if (!observerOnly) broadcast("lemo", emotion);

        addTurn({
          id: result.message_id || uid(),
          role: "cola",
          content: result.reply_text,
          isFinal: true,
          interrupted: false,
          createdAt: new Date().toISOString(),
        });
        await speak(result.reply_text, emotion, turnStarted, sample);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setServices((s) => ({ ...s, aurora: { health: "down", note: msg } }));
        setError(`Cola could not generate a reply. Use MANUAL RESPONSE or try again. (${msg})`);
        go("ERROR");
      }
    },
    [addTurn, broadcast, go, observerOnly, sessionId, speak],
  );

  /* -------------------------------- controls ------------------------------- */
  const stopCola = useCallback(
    (markInterrupted = true) => {
      voiceRef.current.cancel();
      if (markInterrupted && stateRef.current === "COLA_SPEAKING") {
        interruptedRef.current = true;
        setTurns((t) => {
          const copy = [...t];
          for (let i = copy.length - 1; i >= 0; i--) {
            if (copy[i].role === "cola") {
              copy[i] = { ...copy[i], interrupted: true };
              break;
            }
          }
          return copy;
        });
      }
      go(startedRef.current ? "LISTENING" : "IDLE");
    },
    [go],
  );

  const handleControl = useCallback(
    (evt: LiveControlEvent) => {
      switch (evt.action) {
        case "stop_cola":
          stopCola(true);
          break;
        case "cancel_response":
          voiceRef.current.cancel();
          go(startedRef.current ? "LISTENING" : "IDLE");
          break;
        case "force_listening":
          voiceRef.current.cancel();
          speechRef.current.setMuted(false);
          setMuted(false);
          go("LISTENING");
          break;
        case "mute":
          speechRef.current.setMuted(true);
          setMuted(true);
          break;
        case "resume":
          speechRef.current.setMuted(false);
          setMuted(false);
          break;
        case "replay_last":
          if (lastReplyRef.current) {
            void speak(lastReplyRef.current.text, lastReplyRef.current.lemo, performance.now(), {});
          }
          break;
        case "clear_context":
          setTurns([]);
          setPartial("");
          break;
        case "end_session":
          void stop();
          break;
        case "speak_exact":
        case "manual_response":
          if (evt.payload?.text) {
            const emotion = evt.action === "speak_exact" ? { ...NEUTRAL_LEMO } : lemo || { ...NEUTRAL_LEMO };
            addTurn({
              id: uid(),
              role: "cola",
              content: evt.payload.text,
              isFinal: true,
              interrupted: false,
              source: evt.action,
              createdAt: new Date().toISOString(),
            });
            void speak(evt.payload.text, emotion, performance.now(), {});
          }
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [go, lemo, speak, stopCola],
  );

  const sendControl = useCallback(
    (evt: LiveControlEvent) => {
      broadcast("control", evt);
      if (!observerOnly) handleControl(evt);
    },
    [broadcast, handleControl, observerOnly],
  );

  /* ------------------------------ session life ----------------------------- */
  const startWithMode: (mode: SpeechMode) => Promise<void> = useCallback(
    async (mode: SpeechMode) => {
      const adapter = getSpeechAdapter(mode);
      speechRef.current = adapter;
      await adapter.start(
        {
          onSpeechStart: () => {
            // Barge-in: interviewer talks while Cola speaks.
            if (stateRef.current === "COLA_SPEAKING" || stateRef.current === "VOICE_CONNECTING") {
              stopCola(true);
            }
            go("USER_SPEAKING");
          },
          onPartial: (text) => {
            setPartial(text);
            broadcast("partial", { text });
          },
          onFinal: (text, meta) => {
            speechEndRef.current = performance.now();
            go("FINALIZING_TRANSCRIPT");
            void runTurn(text, meta.finalizationMs);
          },
          onError: (msg) => {
            // Never leave the room stuck in LISTENING when speech cannot run.
            if (msg.startsWith("unsupported:") || msg.startsWith("mic-denied:")) {
              const reason = msg.split(":").slice(1).join(":").trim();
              void adapter.stop();
              setSpeechMode("simulated");
              setServices((s) => ({ ...s, speech: { health: "degraded", note: reason } }));
              setError(`${reason} Typed input is active.`);
              void startWithMode("simulated");
              return;
            }
            setServices((s) => ({ ...s, speech: { health: "degraded", note: msg } }));
            setError(msg);
          },
        },
        { silenceThresholdMs: config?.silence_threshold_ms ?? 750, language: config?.primary_language },
      );
      setServices((s) => ({
        ...s,
        speech: {
          health: adapter.isMock ? "mock" : "ok",
          note: adapter.isMock ? "Typed input fallback" : adapter.id,
        },
      }));
      go("LISTENING");
    },
    [broadcast, config, go, runTurn, stopCola],
  );

  const start = useCallback(async () => {
    if (observerOnly) return;
    setError(null);
    startedRef.current = true;
    go("CONNECTING");

    let mode = speechMode;
    if (mode === "browser") {
      if (!speechRecognitionSupported()) {
        mode = "simulated";
        setSpeechMode("simulated");
        setError("This browser cannot listen live. Typed input is active — Chrome or Edge supports the microphone.");
      } else {
        // Explicit permission prompt, so mic denial is distinguishable from
        // SpeechRecognition failures. Release the probe stream immediately.
        try {
          const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
          probe.getTracks().forEach((t) => t.stop());
        } catch {
          mode = "simulated";
          setSpeechMode("simulated");
          setServices((s) => ({ ...s, speech: { health: "degraded", note: "Microphone permission denied" } }));
          setError("Microphone access was blocked. Allow it in the browser, or use typed input.");
        }
      }
    }
    await startWithMode(mode);
  }, [go, observerOnly, speechMode, startWithMode]);

  const stop = useCallback(async () => {
    startedRef.current = false;
    voiceRef.current.cancel();
    await speechRef.current.stop();
    setPartial("");
    go("IDLE");
  }, [go]);

  const toggleMute = useCallback(() => {
    const next = !muted;
    speechRef.current.setMuted(next);
    setMuted(next);
  }, [muted]);

  const simulateSpeech = useCallback((text: string) => {
    speechRef.current.simulate?.(text);
  }, []);

  useEffect(() => {
    return () => {
      voiceRef.current.cancel();
      void speechRef.current.stop();
    };
  }, []);

  const canSimulate = useMemo(() => speechMode === "simulated", [speechMode]);

  return {
    state,
    turns,
    partial,
    muted,
    amplitude,
    lemo,
    latency,
    latencyHistory,
    services,
    error,
    speechMode,
    canSimulate,
    mockMode: LIVE_MOCK_MODE,
    setSpeechMode,
    start,
    stop,
    toggleMute,
    stopCola: () => sendControl({ action: "stop_cola" }),
    sendControl,
    simulateSpeech,
    clearError: () => setError(null),
  };
}
