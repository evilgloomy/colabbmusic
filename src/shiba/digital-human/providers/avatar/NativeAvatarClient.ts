import type { AvatarProvider, AvatarStatus, AvatarState } from "../../contracts/avatar";
import type { LemoState } from "../../contracts/emotion";
import { RuntimeError } from "../../contracts/session";
export interface AvatarTicket { session_id: string; worker_url: string; token: string; ice_servers: RTCIceServer[] }
/** Generic Shiba protocol. No renderer SDK, model code, host or auth vendor dependency. */
export class NativeAvatarClient implements AvatarProvider {
  readonly id = "shiba-native";
  private status: AvatarStatus = { status: "idle", streamReady: false };
  private listeners = new Set<() => void>();
  private pc?: RTCPeerConnection;
  private ws?: WebSocket;
  private video: HTMLVideoElement | null = null;
  private stream?: MediaStream;
  private generation = 0;
  private connectAbort?: AbortController;
  private utterance?: string;
  private onStarted?: () => void;
  private ended?: { resolve(): void; reject(error: Error): void };
  private completed = false;
  private statsTimer?: ReturnType<typeof setInterval>;
  constructor(private ticket: (signal: AbortSignal) => Promise<AvatarTicket>) {}
  getStatus = () => this.status;
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  private update(patch: Partial<AvatarStatus>) { this.status = { ...this.status, ...patch }; this.listeners.forEach(fn => fn()); }
  attachVideo(element: HTMLVideoElement | null) {
    if (this.video && this.video !== element) this.video.srcObject = null;
    this.video = element;
    if (element && this.stream) { element.srcObject = this.stream; element.muted = false; void element.play().catch(() => this.fail()); }
  }
  private send(body: unknown) {
    if (this.ws?.readyState !== WebSocket.OPEN) throw new RuntimeError("AvatarUnavailable");
    this.ws.send(JSON.stringify(body));
  }
  async connect() {
    await this.disconnect(); const gen = ++this.generation;
    const controller = new AbortController(); this.connectAbort = controller;
    const timer = setTimeout(() => controller.abort(), 12000);
    this.update({ status: "connecting", reason: undefined });
    try {
      const ticket = await this.ticket(controller.signal); controller.signal.throwIfAborted();
      const url = new URL(ticket.worker_url);
      if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error("insecure_worker");
      const pc = new RTCPeerConnection({ iceServers: ticket.ice_servers }); this.pc = pc;
      const stream = new MediaStream(); this.stream = stream;
      pc.ontrack = event => { stream.addTrack(event.track); this.attachVideo(this.video); };
      pc.onconnectionstatechange = () => {
        if (gen !== this.generation) return;
        if (["failed", "disconnected", "closed"].includes(pc.connectionState)) this.fail();
      };
      pc.addTransceiver("audio", { direction: "recvonly" }); pc.addTransceiver("video", { direction: "recvonly" });
      await pc.setLocalDescription(await pc.createOffer());
      await this.until(() => pc.iceGatheringState === "complete", controller.signal);
      const response = await fetch(`${ticket.worker_url}/offer`, { method: "POST", signal: controller.signal,
        headers: { Authorization: `Bearer ${ticket.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ sdp: pc.localDescription!.sdp, type: "offer", session_id: ticket.session_id }) });
      if (!response.ok) throw new Error("offer_failed");
      const answer = await response.json(); controller.signal.throwIfAborted();
      await pc.setRemoteDescription(answer);
      const ws = new WebSocket(`${ticket.worker_url.replace(/^http/, "ws")}/control`); this.ws = ws;
      ws.onmessage = event => {
        if (gen !== this.generation) return;
        let data: any; try { data = JSON.parse(event.data); } catch { return this.fail(); }
        if (data.type === "avatar.ready") this.update({ status: "connected" });
        if (data.type === "telemetry") this.update({ metrics: data.metrics });
        if (data.id !== this.utterance) return;
        if (data.type === "avatar.speaking.started") {
          this.update({ status: "speaking" });
          if (this.video) this.video.muted = false;
          // Playback readiness is required; a server acknowledgment alone is not audible output.
          void this.until(() => Boolean(this.video && this.video.readyState >= 2 && !this.video.paused), controller.signal)
            .then(() => { if (data.id === this.utterance) this.onStarted?.(); }).catch(() => this.fail());
        }
        if (data.type === "avatar.speaking.completed") {
          this.completed = true; this.ended?.resolve(); this.ended = undefined;
          this.update({ status: "connected" });
        }
        if (data.type === "runtime.error") this.fail();
      };
      ws.onclose = () => { if (gen === this.generation) this.fail(); };
      ws.onerror = () => { if (gen === this.generation) this.fail(); };
      await this.until(() => ws.readyState === WebSocket.OPEN, controller.signal);
      this.send({ type: "authenticate", token: ticket.token, session_id: ticket.session_id });
      await this.until(() => this.status.status === "connected" && stream.getAudioTracks().length > 0 && stream.getVideoTracks().length > 0 && pc.connectionState === "connected", controller.signal);
      if (gen !== this.generation) return;
      this.update({ streamReady: true });
      this.statsTimer = setInterval(() => { void pc.getStats().then(stats => {
        const metrics = { ...this.status.metrics };
        stats.forEach(report => {
          if (report.type === "candidate-pair" && report.state === "succeeded") metrics.webrtc_rtt_ms = report.currentRoundTripTime == null ? null : report.currentRoundTripTime * 1000;
          if (report.type === "inbound-rtp" && report.kind === "video") metrics.received_fps = report.framesPerSecond ?? null;
        });
        if (gen === this.generation) this.update({ metrics });
      }).catch(() => undefined); }, 2000);
    } catch { if (gen === this.generation) this.fail(); throw new RuntimeError("AvatarUnavailable"); }
    finally { clearTimeout(timer); }
  }
  private async until(predicate: () => boolean, signal: AbortSignal) {
    const started = performance.now();
    while (!predicate()) { signal.throwIfAborted(); if (performance.now() - started > 12000) throw new RuntimeError("AvatarUnavailable"); await new Promise(resolve => setTimeout(resolve, 10)); }
  }
  async beginUtterance(input: { id: string; emotion: LemoState }, signal: AbortSignal, onStarted: () => void) {
    signal.throwIfAborted();
    if (!this.status.streamReady) throw new RuntimeError("AvatarUnavailable");
    this.utterance = input.id; this.completed = false; this.onStarted = onStarted;
    this.send({ type: "avatar.begin", ...input, format: "pcm_s16le", sample_rate: 16000 });
  }
  async pushAudio(chunk: ArrayBuffer, signal: AbortSignal) {
    if (!this.status.streamReady) throw new RuntimeError("AvatarUnavailable");
    const bytes = new Uint8Array(chunk);
    for (let offset = 0; offset < bytes.length; offset += 16000) {
      await this.until(() => !this.ws || this.ws.bufferedAmount < 128000, signal); signal.throwIfAborted();
      if (this.ws?.readyState !== WebSocket.OPEN) throw new RuntimeError("AvatarUnavailable");
      this.ws.send(bytes.slice(offset, offset + 16000));
    }
  }
  async endUtterance(signal: AbortSignal) {
    signal.throwIfAborted();
    const finished = new Promise<void>((resolve, reject) => { this.ended = { resolve, reject }; });
    const abort = () => this.ended?.reject(new RuntimeError("AvatarUnavailable"));
    const timer = setTimeout(abort, 60000);
    signal.addEventListener("abort", abort, { once: true });
    try { this.send({ type: "avatar.end", id: this.utterance }); if (this.completed) this.ended?.resolve(); await finished; }
    finally { clearTimeout(timer); signal.removeEventListener("abort", abort); this.ended = undefined; }
  }
  interrupt() {
    // Mute immediately to cover network transit / receiver jitter-buffer audio.
    if (this.video) this.video.muted = true;
    try { this.send({ type: "avatar.cancel", id: this.utterance }); } catch {}
    this.utterance = undefined; this.onStarted = undefined; this.ended?.resolve(); this.ended = undefined;
    if (this.status.streamReady) this.update({ status: "connected" });
  }
  setState(state: AvatarState) { try { this.send({ type: "avatar.state", state }); } catch {} }
  private fail() {
    this.ended?.reject(new RuntimeError("AvatarUnavailable")); this.ended = undefined;
    const expectedGeneration = this.generation + 1;
    void this.disconnect().then(() => { if (this.generation === expectedGeneration) this.update({ status: "fallback", reason: "AvatarUnavailable" }); });
  }
  async disconnect() {
    ++this.generation; this.connectAbort?.abort(); this.connectAbort = undefined;
    clearInterval(this.statsTimer); this.statsTimer = undefined;
    this.ended?.reject(new RuntimeError("AvatarUnavailable")); this.ended = undefined;
    const ws = this.ws; this.ws = undefined; if (ws) { ws.onclose = null; ws.onerror = null; ws.close(); }
    this.pc?.close(); this.pc = undefined;
    this.stream?.getTracks().forEach(track => track.stop()); this.stream = undefined;
    if (this.video) { this.video.muted = true; this.video.srcObject = null; }
    this.update({ status: "idle", streamReady: false });
  }
}
