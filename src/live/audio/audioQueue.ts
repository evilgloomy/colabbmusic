// Provider-agnostic audio queue with cancel/flush semantics.
// Voice adapters push playable chunks; barge-in calls cancel() which must stop
// the current chunk AND drop everything queued behind it.

export interface AudioChunk {
  /** Plays the chunk. Must resolve when finished, reject/resolve fast on abort. */
  play: (signal: AbortSignal) => Promise<void>;
}

export class AudioQueue {
  private queue: AudioChunk[] = [];
  private controller: AbortController | null = null;
  private running = false;
  private firstAudioFired = false;

  onFirstAudio?: () => void;
  onDrained?: () => void;
  onError?: (message: string) => void;

  get isActive() {
    return this.running || this.queue.length > 0;
  }

  push(chunk: AudioChunk) {
    this.queue.push(chunk);
    void this.pump();
  }

  /** Drop pending chunks but let the current one finish. */
  flush() {
    this.queue = [];
  }

  /** Immediate stop: abort current playback and drop the queue. */
  cancel() {
    this.queue = [];
    this.controller?.abort();
    this.controller = null;
    this.running = false;
    this.firstAudioFired = false;
  }

  reset() {
    this.cancel();
  }

  private async pump() {
    if (this.running) return;
    this.running = true;
    try {
      while (this.queue.length) {
        const chunk = this.queue.shift()!;
        this.controller = new AbortController();
        const signal = this.controller.signal;
        if (signal.aborted) break;
        try {
          if (!this.firstAudioFired) {
            this.firstAudioFired = true;
            this.onFirstAudio?.();
          }
          await chunk.play(signal);
        } catch (err) {
          if (!signal.aborted) {
            this.onError?.(err instanceof Error ? err.message : String(err));
          }
          break;
        }
        if (signal.aborted) break;
      }
    } finally {
      this.running = false;
      this.controller = null;
      if (!this.queue.length) {
        this.firstAudioFired = false;
        this.onDrained?.();
      }
    }
  }
}

export function splitIntoSpeakableChunks(text: string): string[] {
  const parts = text
    .split(/(?<=[.!?。！？…])\s+|(?<=[。！？])/u)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? parts : [text];
}
