import type { LiveState } from "@/live/lib/types";
import portrait from "@/assets/campaign/portrait-close.jpg";

const LABEL: Record<LiveState, string> = {
  IDLE: "Ready",
  CONNECTING: "Connecting",
  LISTENING: "Listening",
  USER_SPEAKING: "Listening",
  FINALIZING_TRANSCRIPT: "Listening",
  AURORA_PROCESSING: "Thinking",
  LEMO_PROCESSING: "Thinking",
  VOICE_CONNECTING: "Thinking",
  COLA_SPEAKING: "Speaking",
  INTERRUPTED: "Listening",
  ERROR: "Paused",
};

export default function ColaStage({ state }: { state: LiveState }) {
  const speaking = state === "COLA_SPEAKING";
  const listening = state === "LISTENING" || state === "USER_SPEAKING" || state === "FINALIZING_TRANSCRIPT";

  return (
    <div className="flex flex-col items-center">
      <div className="live-halo" data-active={speaking || listening}>
        <img
          src={portrait}
          alt="Cola B"
          className="h-48 w-48 rounded-full object-cover md:h-64 md:w-64"
          style={{ objectPosition: "50% 22%" }}
        />
      </div>

      <p className="live-eyebrow mt-8">{LABEL[state]}</p>

      {speaking && (
        <div className="live-wave mt-4 flex h-6 items-end" aria-hidden="true">
          <span /><span /><span /><span /><span />
        </div>
      )}
      {listening && (
        <div className="mt-4 h-6 text-xs opacity-50">Cola is listening…</div>
      )}
    </div>
  );
}
