import { DigitalHumanRuntime } from "./DigitalHumanRuntime";
import type { DigitalHumanCharacter } from "../contracts/character";
import type { BrainProvider, Message } from "../contracts/brain";
import type { EmotionProvider, LemoState } from "../contracts/emotion";
import type { SpeechProvider, AudioOutput, Microphone, AudioChunk } from "../contracts/speech";
import type { AvatarProvider, AvatarState } from "../contracts/avatar";
import { normalizeError, type RuntimeTelemetry } from "../contracts/session";

export interface SessionOptions {
  character: DigitalHumanCharacter; sessionId: string; brain: BrainProvider; emotion: EmotionProvider;
  speech: SpeechProvider; avatar: AvatarProvider; output: AudioOutput;
  microphone: Microphone; language?: string; silenceThresholdMs?: number;
}
export class DigitalHumanSession extends DigitalHumanRuntime {
  private active = false;
  private lifecycle = 0;
  private turn?: AbortController;
  private history: Message[] = [];
  private interrupted = false;
  private last?: { text: string; emotion: LemoState };
  private state: AvatarState = "IDLE";
  constructor(readonly options: SessionOptions) { super(); }
  private go(state: AvatarState) { this.state = state; this.options.avatar.setState(state); this.emit({ type: "state", state }); }
  async start() {
    if (this.active) return;
    this.active = true; const lifecycle = ++this.lifecycle;
    // The gesture starts audio and microphone setup alongside renderer warm-up.
    const outputReady = this.options.output.prepare();
    void this.options.avatar.connect().then(async () => {
      if (!this.active || lifecycle !== this.lifecycle) return;
      this.emit({ type: "avatar.ready" });
    }).catch(() => this.emit({ type: "runtime.error", error: normalizeError(null, "AvatarUnavailable") }));
    try {
      await outputReady;
      if (!this.active || lifecycle !== this.lifecycle) return;
      await this.options.microphone.start({
        onSpeechStart: () => this.onUserSpeech(),
        onPartial: text => { if (this.active) this.emit({ type: "user.speech.partial", text }); },
        onFinal: (text, meta) => { if (this.active) void this.onUserText(text, meta.finalizationMs); },
        onError: () => this.emit({ type: "runtime.error", error: normalizeError(null, "MicrophoneUnavailable") }),
      }, { language: this.options.language ?? this.options.character.defaultLanguage, silenceThresholdMs: this.options.silenceThresholdMs });
      if (!this.active || lifecycle !== this.lifecycle) { await this.options.microphone.stop(); return; }
      this.go("LISTENING"); this.emit({ type: "session.connected" });
    } catch (error) { this.emit({ type: "runtime.error", error: normalizeError(error, "MicrophoneUnavailable") }); await this.stop(); }
  }
  onUserSpeech() {
    if (!this.active) return;
    if (this.turn) this.interrupt();
    this.emit({ type: "user.speech.started" }); this.go("LISTENING");
  }
  async onUserText(text: string, finalizationMs = 0) {
    if (!this.active || !text.trim()) return;
    this.interrupt(false);
    const controller = new AbortController(); this.turn = controller;
    const signal = controller.signal;
    const started = performance.now() - finalizationMs;
    let metrics: RuntimeTelemetry = { speech_finalization_ms: finalizationMs };
    this.emit({ type: "user.speech.final", text }); this.go("THINKING"); this.emit({ type: "brain.started" });
    try {
      const brainStart = performance.now();
      const result = await this.options.brain.generate({ character_id: this.options.character.id,
        session_id: this.options.sessionId, mode: "live_interview", user_text: text,
        conversation_history: this.history.slice(-12), interrupted_previous_turn: this.interrupted,
        speech_finalization_ms: finalizationMs }, signal);
      signal.throwIfAborted(); this.interrupted = false;
      metrics = { ...metrics, ...result.latency, aurora_ms: result.latency?.aurora_ms ?? performance.now() - brainStart };
      this.history.push({ role: "interviewer", content: text }, { role: "cola", content: result.reply_text });
      this.history = this.history.slice(-40);
      this.emit({ type: "brain.completed", result });
      const emotionStart = performance.now();
      const emotion = await this.options.emotion.analyze({ userText: text, replyText: result.reply_text, supplied: result.lemo });
      signal.throwIfAborted();
      metrics.lemo_ms = result.latency?.lemo_ms ?? performance.now() - emotionStart;
      this.emit({ type: "emotion.updated", emotion });
      await this.speak(result.reply_text, emotion, signal, started, metrics);
    } catch (error) {
      if (!signal.aborted) this.emit({ type: "runtime.error", error: normalizeError(error, "BrainUnavailable") });
    } finally {
      if (this.turn === controller) { this.turn = undefined; this.go(this.active ? "LISTENING" : "IDLE"); }
    }
  }
  private async speak(text: string, emotion: LemoState, signal: AbortSignal, started: number, metrics: RuntimeTelemetry) {
    this.last = { text, emotion };
    const voiceStart = performance.now();
    let native = this.options.avatar.getStatus().streamReady;
    let audible = false;
    const onStarted = () => {
      if (audible || signal.aborted) return;
      audible = true; this.go("SPEAKING");
      metrics.total_ms = performance.now() - started;
      if (native) { metrics.render_start_ms = performance.now() - voiceStart; this.emit({ type: "avatar.speaking.started" }); }
      this.emit({ type: "speech.started" }); this.emit({ type: "telemetry", metrics: { ...metrics } });
    };
    const saved: AudioChunk[] = [];
    const useLocal = async () => {
      // Close remote tracks before audible local fallback; never overlap sources.
      await this.options.avatar.disconnect(); signal.throwIfAborted(); native = false;
      this.emit({ type: "runtime.error", error: normalizeError(null, "AvatarUnavailable") });
      for (const chunk of saved) this.options.output.enqueue(chunk, signal, onStarted);
    };
    if (native) {
      try { await this.options.avatar.beginUtterance({ id: crypto.randomUUID(), emotion }, signal, onStarted); }
      catch { signal.throwIfAborted(); await useLocal(); }
    }
    try {
      let first = true;
      for await (const chunk of this.options.speech.synthesize({ text, emotion, language: this.options.language ?? this.options.character.defaultLanguage, signal })) {
        signal.throwIfAborted();
        if (first) {
          first = false; metrics.voice_ttfa_ms = performance.now() - voiceStart;
          if (emotion.pause_before_ms > 0) await new Promise<void>((resolve, reject) => {
            const abort = () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); };
            const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, Math.min(600, emotion.pause_before_ms));
            signal.addEventListener("abort", abort, { once: true });
          });
          signal.throwIfAborted();
        }
        saved.push(chunk);
        if (saved.reduce((sum, c) => sum + c.pcm.byteLength, 0) > 16000 * 2 * 45) throw new Error("SpeechUnavailable");
        this.emit({ type: "speech.chunk" });
        if (native) {
          try { await this.options.avatar.pushAudio(chunk.pcm, signal); }
          catch { signal.throwIfAborted(); await useLocal(); }
        } else this.options.output.enqueue(chunk, signal, onStarted);
      }
      if (native) {
        try { await this.options.avatar.endUtterance(signal); this.emit({ type: "avatar.speaking.completed" }); }
        catch { signal.throwIfAborted(); await useLocal(); }
      }
      if (!native) await this.options.output.drain(signal);
    } catch (error) {
      signal.throwIfAborted();
      this.options.output.cancel(); await this.options.avatar.disconnect(); native = false;
      this.emit({ type: "runtime.error", error: normalizeError(error, "SpeechUnavailable") });
      await this.options.output.emergency(text, this.options.language ?? this.options.character.defaultLanguage, signal, onStarted);
    }
    signal.throwIfAborted(); this.emit({ type: "speech.completed" });
    this.emit({ type: "telemetry", metrics: { ...metrics } });
  }
  interrupt(announce = true) {
    const started = performance.now();
    if (this.turn) this.interrupted = true;
    this.turn?.abort(); this.turn = undefined;
    this.options.output.cancel(); this.options.avatar.interrupt();
    this.go(this.active ? "LISTENING" : "IDLE");
    if (announce) { this.emit({ type: "session.interrupted" }); this.emit({ type: "telemetry", metrics: { interrupt_local_ms: performance.now() - started } }); }
  }
  async say(text: string, emotion: LemoState) {
    if (!this.active) return;
    this.interrupt(); const controller = new AbortController(); this.turn = controller;
    try { await this.speak(text, emotion, controller.signal, performance.now(), {}); }
    catch (error) { if (!controller.signal.aborted) this.emit({ type: "runtime.error", error: normalizeError(error, "SpeechUnavailable") }); }
    finally { if (this.turn === controller) { this.turn = undefined; this.go("LISTENING"); } }
  }
  replay() { if (this.last) void this.say(this.last.text, this.last.emotion); }
  clearHistory() { this.interrupt(); this.history = []; }
  setMuted(value: boolean) { this.options.microphone.setMuted(value); }
  async stop() {
    this.active = false; ++this.lifecycle; this.interrupt(false);
    await Promise.allSettled([this.options.microphone.stop(), this.options.avatar.disconnect()]);
    this.emit({ type: "session.disconnected" });
  }
}
