// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { DigitalHumanSession, type SessionOptions } from "./DigitalHumanSession";
import { NEUTRAL } from "../contracts/emotion";
import { normalizeError } from "../contracts/session";
const chunk = { pcm: new ArrayBuffer(640), sampleRate: 16000 as const };
function fixture(native = false) {
  const options: SessionOptions = {
    character: { id: "test", displayName: "Test", brainProfile: "profile", speech: { provider: "test" }, avatar: { provider: "test", avatarId: "test" }, defaultLanguage: "yue" },
    sessionId: "session",
    brain: { id: "test", generate: vi.fn().mockResolvedValue({ reply_text: "你好呀", response_id: "response", provider: "test", model: "test" }) },
    emotion: { id: "test", analyze: vi.fn().mockResolvedValue(NEUTRAL) },
    speech: { id: "test", synthesize: vi.fn(async function* () { yield chunk; }) },
    avatar: { id: "test", connect: vi.fn().mockResolvedValue(undefined), disconnect: vi.fn().mockResolvedValue(undefined),
      beginUtterance: vi.fn(async (_, __, started) => started()), pushAudio: vi.fn().mockResolvedValue(undefined), endUtterance: vi.fn().mockResolvedValue(undefined),
      interrupt: vi.fn(), attachVideo: vi.fn(), setState: vi.fn(), getStatus: () => ({ status: native ? "connected" : "fallback", streamReady: native }), subscribe: () => () => {} },
    microphone: { start: vi.fn().mockResolvedValue(undefined), stop: vi.fn().mockResolvedValue(undefined), setMuted: vi.fn() },
    output: { prepare: vi.fn().mockResolvedValue(undefined), enqueue: vi.fn((_, __, started) => started()), drain: vi.fn().mockResolvedValue(undefined), cancel: vi.fn(), emergency: vi.fn().mockResolvedValue(undefined) },
  };
  const session = new DigitalHumanSession(options); return { session, options };
}
describe("DigitalHumanSession", () => {
  it("uses only remote media when the avatar is online", async () => {
    const { session, options } = fixture(true); const events: string[] = [];
    session.subscribe(event => events.push(event.type));
    await session.start(); await session.onUserText("Cola 你好呀 今日第一次 live 傾計感覺點呀", 30);
    expect(options.avatar.pushAudio).toHaveBeenCalledWith(chunk.pcm, expect.any(AbortSignal));
    expect(options.output.enqueue).not.toHaveBeenCalled(); expect(options.output.emergency).not.toHaveBeenCalled();
    expect(events).toContain("brain.completed"); expect(events).toContain("emotion.updated"); expect(events).toContain("telemetry");
    await session.stop(); expect(options.microphone.stop).toHaveBeenCalled(); expect(options.avatar.disconnect).toHaveBeenCalled();
  });
  it("uses local MiniMax PCM when the worker is absent", async () => {
    const { session, options } = fixture(); await session.start(); await session.onUserText("Hello");
    expect(options.output.enqueue).toHaveBeenCalled(); expect(options.avatar.pushAudio).not.toHaveBeenCalled();
  });
  it("closes native media before falling back to the same MiniMax PCM", async () => {
    const { session, options } = fixture(true);
    vi.mocked(options.avatar.pushAudio).mockRejectedValueOnce(new Error("private failure"));
    await session.start(); await session.onUserText("Hello");
    expect(options.avatar.disconnect).toHaveBeenCalled(); expect(options.output.enqueue).toHaveBeenCalledTimes(1);
    expect(options.output.emergency).not.toHaveBeenCalled();
    expect(vi.mocked(options.avatar.disconnect).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(options.output.enqueue).mock.invocationCallOrder[0]);
  });
  it("suppresses a late brain reply after barge-in even if transport ignores abort", async () => {
    const { session, options } = fixture(true); let finish: (result: any) => void;
    vi.mocked(options.brain.generate).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    await session.start(); const turn = session.onUserText("Hello"); session.onUserSpeech();
    expect(vi.mocked(options.brain.generate).mock.calls[0][1].aborted).toBe(true);
    finish!({ reply_text: "stale" }); await turn;
    expect(options.speech.synthesize).not.toHaveBeenCalled(); expect(options.avatar.interrupt).toHaveBeenCalled();
  });
  it("aborts synthesis and both outputs immediately", async () => {
    const { session, options } = fixture(true); let signal: AbortSignal | undefined;
    options.speech.synthesize = async function* (input) {
      signal = input.signal; yield chunk;
      await new Promise<void>(resolve => input.signal.addEventListener("abort", () => resolve(), { once: true }));
      input.signal.throwIfAborted(); yield chunk;
    };
    await session.start(); const turn = session.onUserText("Hello");
    await vi.waitFor(() => expect(signal).toBeDefined()); session.interrupt(); await turn;
    expect(signal!.aborted).toBe(true); expect(options.output.cancel).toHaveBeenCalled();
    expect(options.output.emergency).not.toHaveBeenCalled();
  });
  it("falls back to browser speech only on synthesis failure", async () => {
    const { session, options } = fixture(); options.speech.synthesize = async function* () { throw new Error("secret"); };
    await session.start(); await session.onUserText("Hello"); expect(options.output.emergency).toHaveBeenCalled();
  });
  it("does not start the mic when Stop wins a startup race", async () => {
    const { session, options } = fixture(); let release: () => void;
    options.output.prepare = () => new Promise(resolve => { release = resolve; });
    const start = session.start(); await session.stop(); release!(); await start;
    expect(options.microphone.start).not.toHaveBeenCalled();
  });
  it("normalizes errors without provider exception details", () => {
    expect(normalizeError(new Error("private context and key"), "BrainUnavailable").message).toBe("BrainUnavailable");
  });
});
