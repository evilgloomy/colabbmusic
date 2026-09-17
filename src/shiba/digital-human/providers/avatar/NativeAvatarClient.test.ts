// @vitest-environment node
import { expect, it, vi } from "vitest";
import { NativeAvatarClient } from "./NativeAvatarClient";
import { NEUTRAL } from "../../contracts/emotion";
it("stops pending ticket creation and never revives a disconnected session", async () => {
  let signal: AbortSignal;
  let finish: (value: any) => void;
  const client = new NativeAvatarClient(s => { signal = s; return new Promise(resolve => { finish = resolve; }); });
  const connecting = client.connect().catch(() => undefined);
  await vi.waitFor(() => expect(signal!).toBeDefined());
  await client.disconnect();
  expect(signal!.aborted).toBe(true);
  finish!({ worker_url: "https://worker.invalid" }); await connecting;
  expect(client.getStatus()).toMatchObject({ status: "idle", streamReady: false });
});
it("normalizes missing worker configuration and keeps the portrait available", async () => {
  const client = new NativeAvatarClient(async () => { throw new Error("private backend failure"); });
  await expect(client.connect()).rejects.toThrow("AvatarUnavailable");
  await Promise.resolve(); expect(client.getStatus().streamReady).toBe(false);
});
it("mutes remote playback synchronously on interruption", () => {
  const client = new NativeAvatarClient(async () => { throw new Error(); });
  const video = { muted: false, srcObject: null } as HTMLVideoElement;
  client.attachVideo(video); client.interrupt(); expect(video.muted).toBe(true);
});
it("rejects utterances unless native media is ready", async () => {
  const client = new NativeAvatarClient(async () => { throw new Error(); });
  await expect(client.beginUtterance({ id: "turn", emotion: NEUTRAL }, new AbortController().signal, () => {})).rejects.toThrow("AvatarUnavailable");
});
