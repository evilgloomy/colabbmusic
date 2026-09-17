// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { createMinimaxColaVoiceAdapter } from "./minimaxVoice";
import { getVoiceDiagnostics } from "./voiceDiagnostics";
import type { VoiceAdapter, VoiceRequest } from "@/live/lib/types";
const mocks = vi.hoisted(() => ({ ready: false, rendered: true, speak: vi.fn(), interrupt: vi.fn(), localStarts: 0 }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "user-session" } } }) } } }));
vi.mock("@/live/avatar/realtimeAvatar", () => ({ realtimeAvatarBridge: {
  isReady: () => mocks.ready, interrupt: mocks.interrupt,
  speakAudioBuffers: async (...args: unknown[]) => { mocks.speak(...args); return mocks.rendered; },
} }));
class Audio {
  state = "running"; destination = {};
  createAnalyser() { return { fftSize: 0, connect() {}, getByteTimeDomainData() {} }; }
  async decodeAudioData() { return { sampleRate: 32000, length: 640, numberOfChannels: 1, getChannelData: () => new Float32Array(640) }; }
  createBufferSource() {
    const node = { buffer: null, onended: null as (() => void) | null, connect() {}, disconnect() {}, stop() {},
      start() { mocks.localStarts++; queueMicrotask(() => node.onended?.()); } };
    return node;
  }
}
const req = { text: "test", language: "en", lemo: { warmth: 0.5, energy: 0.5, speaking_rate: 1, pause_before_ms: 0 } } as VoiceRequest;
const handlers = () => ({ onFirstAudio: vi.fn(), onDone: vi.fn(), onError: vi.fn() });
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); mocks.ready = false; mocks.rendered = true; mocks.localStarts = 0; });
function setup(ok = true) {
  vi.stubGlobal("AudioContext", Audio);
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(ok ? { ok: true, audio_base64: "AAE=" } : { error: "voice_not_configured", minimax_voice_id_present: false }), { status: ok ? 200 : 503 })));
  const fallback = { id: "browser", isMock: true, speak: vi.fn(async () => {}), cancel: vi.fn(), flush: vi.fn(), isSpeaking: () => false } satisfies VoiceAdapter;
  return { adapter: createMinimaxColaVoiceAdapter(fallback), fallback };
}
it("successful native avatar never starts a second local MiniMax player", async () => {
  const { adapter, fallback } = setup(); mocks.ready = true;
  await adapter.speak(req, handlers());
  expect(mocks.speak).toHaveBeenCalledOnce();
  expect(mocks.localStarts).toBe(0);
  expect(fallback.speak).not.toHaveBeenCalled();
  expect(getVoiceDiagnostics().state).toBe("online");
});
it("avatar failure retains the real MiniMax audio and portrait fallback", async () => {
  const { adapter, fallback } = setup(); mocks.ready = true; mocks.rendered = false;
  await adapter.speak(req, handlers());
  expect(mocks.localStarts).toBe(1);
  expect(fallback.speak).not.toHaveBeenCalled();
  expect(getVoiceDiagnostics().state).toBe("online");
});
it("MiniMax failure makes browser fallback explicit and never claims a configured voice", async () => {
  const { adapter, fallback } = setup(false);
  fallback.speak.mockImplementation(async () => {
    expect(getVoiceDiagnostics().state).toBe("fallback");
    expect(getVoiceDiagnostics().browserTtsFallback).toBe(true);
  });
  await adapter.speak(req, handlers());
  expect(fallback.speak).toHaveBeenCalledOnce();
  expect(getVoiceDiagnostics().voiceIdConfigured).toBe(false);
  expect(getVoiceDiagnostics().browserTtsFallback).toBe(false);
  expect(getVoiceDiagnostics().state).toBe("fallback");
});
