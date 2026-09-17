import { supabase } from "@/integrations/supabase/client";
import { audioBuffersToLiveAvatarPcm } from "@/live/avatar/audioPcm";

export type RealtimeAvatarStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "speaking"
  | "fallback"
  | "error";

export interface RealtimeAvatarSnapshot {
  status: RealtimeAvatarStatus;
  provider: string;
  configured: boolean | null;
  streamReady: boolean;
  sessionId: string | null;
  connectMs: number | null;
  reason?: string;
}

type SdkSession = {
  start(): Promise<void>;
  stop(): Promise<void>;
  attach(element: HTMLMediaElement): void;
  repeatAudio(audio: string): string;
  interrupt(): void;
  startListening(): string;
  stopListening(): string;
  on(event: string, listener: (...args: unknown[]) => void): void;
  off?(event: string, listener: (...args: unknown[]) => void): void;
};

type SdkModule = {
  LiveAvatarSession: new (
    token: string,
    config?: { autoKeepAlive?: boolean; voiceChat?: { defaultMuted?: boolean } },
  ) => SdkSession;
};

const PROVIDER = "LiveAvatar LITE — Cola B";
const SDK_URL = "https://esm.sh/@heygen/liveavatar-web-sdk@0.0.19?bundle";
const STREAM_READY_EVENT = "session.stream_ready";
const DISCONNECTED_EVENT = "session.disconnected";
const SPEAK_STARTED_EVENT = "avatar.speak_started";
const SPEAK_ENDED_EVENT = "avatar.speak_ended";

/**
 * Realtime avatar bridge.
 *
 * The LiveAvatar API key and Cola avatar id stay in a Supabase Edge Function.
 * The browser receives only a short-lived LITE session token. The actual Cola
 * voice remains MiniMax: decoded MiniMax audio is converted to 24 kHz PCM16 and
 * sent to LiveAvatar via repeatAudio().
 */
class RealtimeAvatarBridge {
  private snapshot: RealtimeAvatarSnapshot = {
    status: "idle",
    provider: PROVIDER,
    configured: null,
    streamReady: false,
    sessionId: null,
    connectMs: null,
  };
  private listeners = new Set<() => void>();
  private session: SdkSession | null = null;
  private mediaElement: HTMLVideoElement | null = null;
  private connectPromise: Promise<boolean> | null = null;
  private speakingPromiseResolve: (() => void) | null = null;
  private speakStartCallback: (() => void) | null = null;
  private speakTimeout: ReturnType<typeof setTimeout> | null = null;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = () => this.snapshot;

  private setSnapshot(patch: Partial<RealtimeAvatarSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  isReady() {
    return Boolean(this.session && this.snapshot.streamReady && (this.snapshot.status === "connected" || this.snapshot.status === "speaking"));
  }

  bindMediaElement(element: HTMLVideoElement | null) {
    this.mediaElement = element;
    if (element) {
      element.autoplay = true;
      element.playsInline = true;
      element.muted = false;
      element.volume = 1;
      if (this.session && this.snapshot.streamReady) {
        try {
          this.session.attach(element);
          void element.play().catch(() => undefined);
        } catch {
          // The SDK will emit a stream-ready event again on a reconnect.
        }
      }
    }
  }

  private async loadSdk(): Promise<SdkModule> {
    // Pinned official SDK build. @vite-ignore keeps Vite from trying to resolve
    // the remote URL at compile time. This avoids mutating the app lockfiles and
    // can later be replaced by a normal package import without changing this API.
    const module = (await import(/* @vite-ignore */ SDK_URL)) as unknown as SdkModule;
    if (!module?.LiveAvatarSession) throw new Error("liveavatar_sdk_unavailable");
    return module;
  }

  async connect(): Promise<boolean> {
    if (this.isReady()) return true;
    if (this.connectPromise) return this.connectPromise;

    this.connectPromise = this.connectInternal().finally(() => {
      this.connectPromise = null;
    });
    return this.connectPromise;
  }

  private async connectInternal(): Promise<boolean> {
    const started = performance.now();
    this.setSnapshot({
      status: "connecting",
      streamReady: false,
      reason: undefined,
      connectMs: null,
    });

    try {
      const { data, error } = await supabase.functions.invoke("liveavatar-session", { body: {} });
      const payload = data as
        | { ok?: boolean; configured?: boolean; session_token?: string; session_id?: string; error?: string }
        | null;

      if (error || !payload?.ok || !payload.session_token) {
        const notConfigured = payload?.configured === false || payload?.error === "not_configured";
        this.setSnapshot({
          status: notConfigured ? "fallback" : "error",
          configured: notConfigured ? false : this.snapshot.configured,
          reason: payload?.error || error?.message || "liveavatar_session_unavailable",
        });
        return false;
      }

      this.setSnapshot({ configured: true, sessionId: payload.session_id ?? null });
      const sdk = await this.loadSdk();
      const session = new sdk.LiveAvatarSession(payload.session_token, {
        autoKeepAlive: true,
        // We already own microphone/STT. LiveAvatar is only the renderer.
        voiceChat: { defaultMuted: true },
      });
      this.session = session;

      session.on(STREAM_READY_EVENT, () => {
        this.setSnapshot({
          status: this.snapshot.status === "speaking" ? "speaking" : "connected",
          streamReady: true,
          connectMs: Math.round(performance.now() - started),
          reason: undefined,
        });
        if (this.mediaElement) {
          try {
            session.attach(this.mediaElement);
            void this.mediaElement.play().catch(() => undefined);
          } catch (err) {
            this.setSnapshot({ reason: err instanceof Error ? err.message : "liveavatar_attach_failed" });
          }
        }
      });

      session.on(SPEAK_STARTED_EVENT, () => {
        this.setSnapshot({ status: "speaking" });
        const callback = this.speakStartCallback;
        this.speakStartCallback = null;
        callback?.();
      });

      session.on(SPEAK_ENDED_EVENT, () => {
        this.finishSpeaking();
      });

      session.on(DISCONNECTED_EVENT, () => {
        this.session = null;
        this.finishSpeaking();
        this.setSnapshot({
          status: "fallback",
          streamReady: false,
          reason: "liveavatar_disconnected",
        });
      });

      await session.start();
      // Some LITE sessions are connected before tracks arrive. Keep the visual
      // fallback until STREAM_READY confirms the real media surface is usable.
      if (!this.snapshot.streamReady) {
        this.setSnapshot({
          status: "connected",
          connectMs: Math.round(performance.now() - started),
          reason: undefined,
        });
      }
      return true;
    } catch (err) {
      this.session = null;
      this.setSnapshot({
        status: "error",
        streamReady: false,
        reason: err instanceof Error ? err.message : "liveavatar_connect_failed",
      });
      return false;
    }
  }

  /**
   * Feed the exact decoded MiniMax utterance into LiveAvatar. LiveAvatar's LITE
   * SDK consumes raw signed 16-bit mono PCM at 24 kHz.
   */
  async speakAudioBuffers(buffers: AudioBuffer[], onStarted?: () => void): Promise<boolean> {
    if (!buffers.length || !this.session || !this.isReady()) return false;

    const pcm = audioBuffersToLiveAvatarPcm(buffers);
    if (!pcm) return false;

    this.clearSpeakWaiter();
    this.speakStartCallback = onStarted ?? null;

    try {
      try {
        this.session.stopListening();
      } catch {
        // LITE sessions can be renderer-only; listening state is best-effort.
      }

      const completion = new Promise<void>((resolve) => {
        this.speakingPromiseResolve = resolve;
        // Safety valve if the provider never emits AVATAR_SPEAK_ENDED.
        this.speakTimeout = setTimeout(() => this.finishSpeaking(), 90_000);
      });

      this.session.repeatAudio(pcm);
      await completion;
      return true;
    } catch (err) {
      this.clearSpeakWaiter();
      this.setSnapshot({
        status: "error",
        reason: err instanceof Error ? err.message : "liveavatar_speak_failed",
      });
      return false;
    }
  }

  interrupt() {
    this.speakStartCallback = null;
    try {
      this.session?.interrupt();
    } catch {
      // A disconnected provider should never block local audio cancellation.
    }
    this.finishSpeaking();
  }

  startListening() {
    try {
      this.session?.startListening();
    } catch {
      // best-effort only
    }
  }

  private finishSpeaking() {
    if (this.speakTimeout) clearTimeout(this.speakTimeout);
    this.speakTimeout = null;
    const resolve = this.speakingPromiseResolve;
    this.speakingPromiseResolve = null;
    this.speakStartCallback = null;

    if (this.session) {
      this.setSnapshot({ status: "connected" });
      try {
        this.session.startListening();
      } catch {
        // best-effort only
      }
    }
    resolve?.();
  }

  private clearSpeakWaiter() {
    if (this.speakTimeout) clearTimeout(this.speakTimeout);
    this.speakTimeout = null;
    const resolve = this.speakingPromiseResolve;
    this.speakingPromiseResolve = null;
    this.speakStartCallback = null;
    resolve?.();
  }

  async disconnect() {
    this.clearSpeakWaiter();
    const session = this.session;
    this.session = null;
    if (session) {
      try {
        await session.stop();
      } catch {
        // Session may already have been closed by the provider.
      }
    }
    this.setSnapshot({
      status: "idle",
      streamReady: false,
      sessionId: null,
      connectMs: null,
      reason: undefined,
    });
  }
}

export const realtimeAvatarBridge = new RealtimeAvatarBridge();
export const REALTIME_AVATAR_PROVIDER_LABEL = PROVIDER;
