// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShibaComputeAvatarClient, type ComputeGrant } from "./ShibaComputeAvatarClient";
import { audioBuffersToShibaPcm, SHIBA_PCM_SAMPLE_RATE } from "./audioPcm";

const grant: ComputeGrant = { session_id: "ea0ca7ce-7103-4924-b46a-2cc5a5686965", session_token: "scoped-session-only",
  signaling_url: "https://compute.example/v1/compute/sessions/ea0ca7ce-7103-4924-b46a-2cc5a5686965", expires_at: new Date(Date.now() + 600_000).toISOString() };
class FakeStream {
  tracks: MediaStreamTrack[] = [];
  addTrack(track: MediaStreamTrack) { this.tracks.push(track); }
  getTracks() { return this.tracks; }
}
class FakeChannel {
  readyState = "open"; bufferedAmount = 0; onmessage: ((event: { data: string }) => void) | null = null; onclose: (() => void) | null = null;
  sent: unknown[] = []; utterance = "";
  event(value: unknown) { this.onmessage?.({ data: JSON.stringify(value) }); }
  send(value: string | ArrayBuffer) {
    this.sent.push(value);
    if (typeof value === "string") {
      const m = JSON.parse(value);
      if (m.type === "utterance.start") { this.utterance = m.utterance_id; queueMicrotask(() => this.event({ type: "utterance.started", utterance_id: m.utterance_id })); }
      if (m.type === "utterance.end") queueMicrotask(() => this.event({ type: "utterance.completed", utterance_id: m.utterance_id }));
      if (m.type === "utterance.cancel") queueMicrotask(() => this.event({ type: "utterance.cancelled", utterance_id: m.utterance_id, cancel_ms: 4 }));
    }
  }
  close() { this.readyState = "closed"; }
}
class FakePeer {
  connectionState = "new"; iceGatheringState = "complete";
  localDescription = { type: "offer", sdp: "v=0" };
  onconnectionstatechange: (() => void) | null = null;
  ontrack: ((event: { track: MediaStreamTrack }) => void) | null = null;
  channel = new FakeChannel();
  addTransceiver() {}
  createDataChannel(label: string) { expect(label).toBe("shiba-avatar-control"); return this.channel; }
  async createOffer() { return this.localDescription; }
  async setLocalDescription() {}
  async setRemoteDescription() {
    this.connectionState = "connected";
    for (const kind of ["video", "audio"]) this.ontrack?.({ track: { kind, muted: false, readyState: "live", stop: vi.fn(), onended: null } as unknown as MediaStreamTrack });
  }
  close() { this.connectionState = "closed"; }
}
const clients: ShibaComputeAvatarClient[] = [];
afterEach(async () => { for (const c of clients.splice(0)) await c.disconnect(); vi.unstubAllGlobals(); });
function setup() {
  vi.stubGlobal("MediaStream", FakeStream);
  const peer = new FakePeer();
  const calls: { url: string; method?: string; token?: string }[] = [];
  const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), method: init?.method, token: (init?.headers as Record<string, string>)?.Authorization });
    return new Response(JSON.stringify(String(input).endsWith("/offer") ? { type: "answer", sdp: "v=0" } :
      { status: "ready", ice_servers: [], ice_transport_policy: "relay", diagnostics: { renderer: "ready" } }), { status: 200 });
  });
  const client = new ShibaComputeAvatarClient({ createSession: vi.fn(async () => grant), fetcher: fetcher as typeof fetch,
    createPeer: config => { expect(config.iceTransportPolicy).toBe("relay"); return peer as unknown as RTCPeerConnection; } });
  clients.push(client);
  return { client, peer, calls };
}

describe("ShibaCompute browser client", () => {
  it("keeps portrait fallback when session creation fails", async () => {
    const client = new ShibaComputeAvatarClient({ createSession: async () => { throw Error("no_capacity"); } });
    clients.push(client);
    expect(await client.connect("live-session")).toBe(false);
    expect(client.getSnapshot().status).toBe("fallback");
    expect(await client.speakPcm(new Uint8Array(640))).toBe(false);
  });
  it("establishes A/V, forwards PCM/LEMO, uses only scoped auth and tears down", async () => {
    const { client, peer, calls } = setup();
    expect(await client.connect("live-session")).toBe(true);
    const first = vi.fn();
    expect(await client.speakPcm(new Uint8Array(640), first, { energy: 0.8 })).toBe(true);
    expect(first).toHaveBeenCalledOnce();
    const start = JSON.parse(peer.channel.sent.find(v => typeof v === "string") as string);
    expect(start.format).toEqual({ encoding: "pcm_s16le", sample_rate: 16000, channels: 1 });
    expect(start.lemo).toEqual({ energy: 0.8 });
    expect(peer.channel.sent.some(v => v instanceof ArrayBuffer)).toBe(true);
    await client.disconnect();
    expect(peer.connectionState).toBe("closed");
    expect(calls.every(c => c.url.startsWith("https://compute.example/") && c.token === "Bearer scoped-session-only")).toBe(true);
    expect(calls.some(c => c.method === "DELETE")).toBe(true);
  });
  it("interrupt reaches renderer and cancels further PCM instead of starting local playback", async () => {
    const { client, peer } = setup();
    await client.connect("live-session");
    const speech = client.speakPcm(new Uint8Array(32000));
    await new Promise(resolve => setTimeout(resolve, 25));
    client.interrupt();
    expect(await speech).toBe(true);
    expect(peer.channel.sent.some(v => typeof v === "string" && JSON.parse(v).type === "utterance.cancel")).toBe(true);
    expect(client.getSnapshot().diagnostics?.cancel_ms).toBe(4);
    expect(peer.channel.sent.filter(v => v instanceof ArrayBuffer).length).toBeLessThan(5);
  });
  it("closes media before a failed reply is handed to MiniMax local fallback", async () => {
    const { client, peer } = setup();
    await client.connect("live-session");
    const speech = client.speakPcm(new Uint8Array(32000));
    await new Promise(resolve => setTimeout(resolve, 10));
    peer.channel.event({ type: "utterance.error" });
    expect(await speech).toBe(false);
    expect(peer.connectionState).toBe("closed");
    expect(client.getSnapshot().streamReady).toBe(false);
  });
  it("releases a grant arriving after disconnect", async () => {
    let resolve!: (g: ComputeGrant) => void;
    const fetcher = vi.fn(async () => new Response("{}"));
    const client = new ShibaComputeAvatarClient({ createSession: () => new Promise(r => { resolve = r; }), fetcher });
    clients.push(client);
    const connecting = client.connect("live-session");
    await client.disconnect();
    resolve(grant);
    expect(await connecting).toBe(false);
    expect(fetcher.mock.calls.length).toBe(1);
    expect(client.getSnapshot().status).toBe("idle");
  });
  it("normalizes complete MiniMax audio to mono PCM16 at exactly 16kHz", () => {
    const audio = { length: 32000, sampleRate: 32000, numberOfChannels: 2, getChannelData: () => new Float32Array(32000).fill(0.25) } as unknown as AudioBuffer;
    const pcm = audioBuffersToShibaPcm([audio]);
    expect(SHIBA_PCM_SAMPLE_RATE).toBe(16000);
    expect(pcm.byteLength).toBe(32000);
    expect(new DataView(pcm.buffer).getInt16(0, true)).toBe(8192);
  });
});
