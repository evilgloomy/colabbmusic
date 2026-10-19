import { audioBuffersToShibaPcm } from "./audioPcm";

export type RealtimeAvatarStatus = "idle" | "connecting" | "connected" | "speaking" | "fallback" | "error";
export interface RealtimeAvatarSnapshot {
  status: RealtimeAvatarStatus; provider: string; configured: boolean | null; streamReady: boolean;
  sessionId: string | null; connectMs: number | null; reason?: string; diagnostics?: Record<string, unknown>;
}
export type ComputeGrant = { session_id: string; session_token: string; signaling_url: string; expires_at: string };
type SessionStatus = { status: string; ice_servers: RTCIceServer[]; ice_transport_policy: RTCIceTransportPolicy; diagnostics?: Record<string, unknown> };
type Dependencies = {
  createSession: (liveSessionId: string) => Promise<ComputeGrant>;
  fetcher?: typeof fetch;
  createPeer?: (config: RTCConfiguration) => RTCPeerConnection;
};
type Utterance = { id: string; resolve: (ok: boolean) => void; onStarted?: () => void; timer: ReturnType<typeof setTimeout> };
export const SHIBA_AVATAR_LABEL = "Shiba Native Avatar — Cola B";
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/** Gateway-scoped grant, synchronized WebRTC media and bounded PCM control. */
export class ShibaComputeAvatarClient {
  private snapshot: RealtimeAvatarSnapshot = { status: "idle", provider: SHIBA_AVATAR_LABEL, configured: null, streamReady: false, sessionId: null, connectMs: null };
  private listeners = new Set<() => void>();
  private peer: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;
  private stream: MediaStream | null = null;
  private element: HTMLVideoElement | null = null;
  private grant: ComputeGrant | null = null;
  private connecting: Promise<boolean> | null = null;
  private generation = 0;
  private utteranceGeneration = 0;
  private utterance: Utterance | null = null;
  private expiry: ReturnType<typeof setTimeout> | null = null;
  private poll: ReturnType<typeof setInterval> | null = null;
  private requestAbort = new AbortController();
  private pollActive = false;
  private fetcher: typeof fetch;

  constructor(private readonly deps: Dependencies) { this.fetcher = deps.fetcher ?? fetch; }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.snapshot;
  private update(patch: Partial<RealtimeAvatarSnapshot>) { this.snapshot = { ...this.snapshot, ...patch }; this.listeners.forEach(listener => listener()); }
  isReady() { return Boolean(this.peer?.connectionState === "connected" && this.channel?.readyState === "open" && this.snapshot.streamReady); }
  bindMediaElement(element: HTMLVideoElement | null) {
    this.element = element;
    if (element) {
      element.autoplay = true; element.playsInline = true; element.muted = false; element.volume = 1;
      if (this.stream) { element.srcObject = this.stream; void element.play().catch(() => this.fail("media_playback_blocked")); }
    }
  }
  private async api<T>(suffix = "", method = "GET", body?: unknown): Promise<T> {
    if (!this.grant) throw Error("compute_session_missing");
    const response = await this.fetcher(this.grant.signaling_url + suffix, {
      method, redirect: "error", signal: AbortSignal.any([this.requestAbort.signal, AbortSignal.timeout(35_000)]),
      headers: { Authorization: "Bearer " + this.grant.session_token, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) { await response.body?.cancel(); throw Error("compute_request_failed"); }
    return response.json() as Promise<T>;
  }
  private async release(grant: ComputeGrant | null) {
    if (!grant) return;
    try {
      const response = await this.fetcher(grant.signaling_url, { method: "DELETE", redirect: "error",
        signal: AbortSignal.timeout(6000), headers: { Authorization: "Bearer " + grant.session_token } });
      await response.body?.cancel();
    } catch { /* Worker lease and session expiry enforce eventual cleanup. */ }
  }
  private ready() {
    if (this.peer?.connectionState !== "connected" || this.channel?.readyState !== "open") return false;
    const tracks = this.stream?.getTracks() ?? [];
    return ["audio", "video"].every(kind => tracks.some(track => track.kind === kind && track.readyState === "live" && !track.muted));
  }
  async connect(liveSessionId: string): Promise<boolean> {
    if (this.isReady()) return true;
    if (this.connecting) return this.connecting;
    this.connecting = this.connectInternal(liveSessionId).finally(() => { this.connecting = null; });
    return this.connecting;
  }
  private async connectInternal(liveSessionId: string) {
    const generation = ++this.generation;
    this.requestAbort = new AbortController();
    const started = performance.now();
    this.update({ status: "connecting", streamReady: false, reason: undefined });
    try {
      const grant = await this.deps.createSession(liveSessionId);
      const url = new URL(grant.signaling_url);
      if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
          url.pathname !== "/v1/compute/sessions/" + grant.session_id || !(Date.parse(grant.expires_at) > Date.now())) throw Error("invalid_compute_grant");
      if (generation !== this.generation) { await this.release(grant); return false; }
      this.grant = grant;
      this.update({ configured: true, sessionId: grant.session_id });
      let status: SessionStatus | null = null;
      const deadline = performance.now() + 85_000;
      while (generation === this.generation && performance.now() < deadline) {
        status = await this.api<SessionStatus>();
        this.update({ diagnostics: status.diagnostics });
        if (status.status === "ready") break;
        if (["error", "ended"].includes(status.status)) throw Error("renderer_unavailable");
        await wait(400);
      }
      if (generation !== this.generation) return false;
      if (status?.status !== "ready") throw Error("renderer_warmup_timeout");
      this.stream = new MediaStream();
      const config = { iceServers: status.ice_servers, iceTransportPolicy: status.ice_transport_policy };
      const peer = this.deps.createPeer?.(config) ?? new RTCPeerConnection(config);
      this.peer = peer;
      peer.addTransceiver("audio", { direction: "recvonly" });
      peer.addTransceiver("video", { direction: "recvonly" });
      const channel = peer.createDataChannel("shiba-avatar-control", { ordered: true });
      this.channel = channel;
      channel.onmessage = event => this.onControl(event.data);
      channel.onclose = () => { if (generation === this.generation) void this.fail("control_channel_closed"); };
      peer.onconnectionstatechange = () => {
        if (generation === this.generation && ["failed", "closed", "disconnected"].includes(peer.connectionState)) void this.fail("webrtc_disconnected");
      };
      peer.ontrack = event => {
        if (generation !== this.generation) return;
        this.stream?.addTrack(event.track);
        event.track.onended = () => { if (generation === this.generation) void this.fail("media_track_ended"); };
      };
      await peer.setLocalDescription(await peer.createOffer());
      const iceDeadline = performance.now() + 12_000;
      while (peer.iceGatheringState !== "complete" && generation === this.generation && performance.now() < iceDeadline) await wait(20);
      if (generation !== this.generation) return false;
      if (peer.iceGatheringState !== "complete") throw Error("ice_gathering_timeout");
      const answer = await this.api<RTCSessionDescriptionInit>("/offer", "POST", { type: "offer", sdp: peer.localDescription?.sdp });
      await peer.setRemoteDescription(answer);
      const mediaDeadline = performance.now() + 15_000;
      while (!this.ready() && generation === this.generation && performance.now() < mediaDeadline) await wait(20);
      if (generation !== this.generation) return false;
      if (!this.ready()) throw Error("webrtc_media_timeout");
      if (this.element) { this.element.srcObject = this.stream; await this.element.play(); }
      this.update({ status: "connected", streamReady: true, connectMs: Math.round(performance.now() - started), reason: undefined });
      this.expiry = setTimeout(() => { void this.fail("compute_session_expired"); }, Math.max(1, Date.parse(grant.expires_at) - Date.now()));
      this.poll = setInterval(() => {
        if (this.pollActive) return;
        this.pollActive = true;
        void this.api<SessionStatus>().then(s => {
          if (generation !== this.generation) return;
          this.update({ diagnostics: s.diagnostics });
          if (["ended", "error"].includes(s.status)) void this.fail("renderer_unavailable");
        }).catch(() => { if (generation === this.generation) void this.fail("compute_unavailable"); }).finally(() => { this.pollActive = false; });
      }, 5000);
      return true;
    } catch {
      if (generation === this.generation) await this.fail("shibacompute_unavailable");
      return false;
    }
  }
  private onControl(raw: unknown) {
    if (typeof raw !== "string" || raw.length > 8192) return;
    let event: { type?: string; utterance_id?: string; cancel_ms?: number };
    try { event = JSON.parse(raw); } catch { return; }
    if (event.type === "utterance.error") { void this.fail("renderer_audio_failed"); return; }
    const current = this.utterance;
    if (!current || event.utterance_id !== current.id) return;
    if (event.type === "utterance.started") {
      this.update({ status: "speaking" }); current.onStarted?.(); current.onStarted = undefined;
    } else if (event.type === "utterance.completed" || event.type === "utterance.cancelled") {
      if (event.type === "utterance.cancelled") this.update({ diagnostics: { ...this.snapshot.diagnostics, cancel_ms: event.cancel_ms } });
      this.finish(true);
    }
  }
  private send(value: unknown) {
    if (this.channel?.readyState !== "open") throw Error("avatar_control_closed");
    this.channel.send(JSON.stringify(value));
  }
  startUtterance(id: string, lemo: Record<string, unknown> = {}) {
    this.send({ type: "utterance.start", utterance_id: id, format: { encoding: "pcm_s16le", sample_rate: 16000, channels: 1 }, lemo });
  }
  pushPcm(pcm: Uint8Array) {
    if (!this.isReady() || !pcm.length || pcm.byteLength % 2 || pcm.byteLength > 16000) throw Error("invalid_pcm");
    this.channel!.send(pcm.slice().buffer);
  }
  endUtterance(id: string) { this.send({ type: "utterance.end", utterance_id: id }); }
  async speakAudioBuffers(buffers: AudioBuffer[], onStarted?: () => void, lemo: Record<string, unknown> = {}): Promise<boolean> {
    return this.speakPcm(audioBuffersToShibaPcm(buffers), onStarted, lemo);
  }
  async speakPcm(pcm: Uint8Array, onStarted?: () => void, lemo: Record<string, unknown> = {}): Promise<boolean> {
    if (!this.isReady() || !pcm.length || pcm.byteLength > 90 * 32000 || this.utterance) return false;
    const id = crypto.randomUUID(), generation = ++this.utteranceGeneration;
    const completion = new Promise<boolean>(resolve => {
      const timer = setTimeout(() => { void this.fail("utterance_timeout"); }, pcm.byteLength / 32 + 15_000);
      this.utterance = { id, resolve, onStarted, timer };
    });
    try {
      this.startUtterance(id, lemo);
      const start = performance.now();
      for (let offset = 0; offset < pcm.length; offset += 640) {
        if (generation !== this.utteranceGeneration) break;
        await wait(Math.max(0, start + offset / 32 - performance.now()));
        if (generation !== this.utteranceGeneration) break;
        const deadline = performance.now() + 1000;
        while (this.channel && this.channel.bufferedAmount > 1280 && performance.now() < deadline) await wait(10);
        if (generation !== this.utteranceGeneration) break;
        if (!this.channel || this.channel.bufferedAmount > 1280) throw Error("audio_backpressure");
        this.pushPcm(pcm.subarray(offset, offset + 640));
      }
      if (generation === this.utteranceGeneration) this.endUtterance(id);
    } catch { await this.fail("avatar_audio_failed"); }
    return completion;
  }
  interrupt() {
    ++this.utteranceGeneration;
    const current = this.utterance;
    if (!current) return;
    try { this.send({ type: "utterance.cancel", utterance_id: current.id }); }
    catch { void this.api("/interrupt", "POST", { utterance_id: current.id }).then(() => this.finish(true)).catch(() => this.fail("interrupt_failed")); }
    clearTimeout(current.timer);
    current.timer = setTimeout(() => { void this.fail("interrupt_timeout"); }, 1500);
  }
  startListening() { /* Listening motion resumes after worker end/cancel. */ }
  private finish(ok: boolean) {
    const current = this.utterance; this.utterance = null;
    if (current) { clearTimeout(current.timer); current.resolve(ok); }
    if (this.isReady()) this.update({ status: "connected" });
  }
  private closeMedia() {
    ++this.generation; ++this.utteranceGeneration; this.requestAbort.abort();
    if (this.expiry) clearTimeout(this.expiry);
    if (this.poll) clearInterval(this.poll);
    this.expiry = null; this.poll = null;
    const peer = this.peer, channel = this.channel;
    this.peer = null; this.channel = null;
    if (channel) { channel.onclose = null; channel.onmessage = null; channel.close(); }
    if (peer) { peer.onconnectionstatechange = null; peer.ontrack = null; peer.close(); }
    this.stream?.getTracks().forEach(track => { track.onended = null; track.stop(); });
    this.stream = null;
    if (this.element) this.element.srcObject = null;
    this.finish(false);
  }
  private async fail(reason: string) {
    const grant = this.grant; this.grant = null;
    this.closeMedia();
    this.update({ status: "fallback", streamReady: false, reason, sessionId: null });
    await this.release(grant);
  }
  async disconnect() {
    const grant = this.grant; this.grant = null;
    this.closeMedia();
    this.update({ status: "idle", streamReady: false, sessionId: null, connectMs: null, reason: undefined });
    await this.release(grant);
  }
}
