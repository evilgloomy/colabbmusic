import { useMemo } from "react";
import portrait from "@/assets/campaign/portrait-close.jpg";
import type { LiveAvatarProps } from "@/live/lib/avatar";

/**
 * Editorial Portrait Placeholder — Cola's live presence today.
 * Idle breathing, state-driven lighting and an amplitude-reactive aura/waveform.
 * There is no blink and no lip sync: a still portrait cannot fake either
 * convincingly. Swappable for a realtime viseme / Live2D / WebGL / streaming
 * avatar provider via LiveAvatarProps.
 */
export default function LiveColaAvatar({
  state,
  emotion,
  amplitude,
  speaking,
  listening,
  className = "",
}: LiveAvatarProps) {
  const level = speaking ? Math.max(0.08, Math.min(1, amplitude)) : 0;
  const thinking =
    state === "AURORA_PROCESSING" || state === "LEMO_PROCESSING" || state === "VOICE_CONNECTING";
  const errored = state === "ERROR";

  const mood = useMemo(() => {
    if (errored) return "error";
    if (speaking) return "speaking";
    if (thinking) return "thinking";
    if (listening) return "listening";
    return "idle";
  }, [errored, listening, speaking, thinking]);

  const warmth = emotion?.warmth ?? 0.5;
  const energy = emotion?.energy ?? 0.4;

  return (
    <div
      className={`live-avatar ${className}`}
      data-mood={mood}
      
      style={
        {
          "--level": level.toFixed(3),
          "--warmth": warmth.toFixed(2),
          "--energy": energy.toFixed(2),
        } as React.CSSProperties
      }
      aria-label={`Cola B — ${mood}`}
      role="img"
    >
      <div className="live-avatar-aura" aria-hidden="true" />
      <div className="live-avatar-frame">
        <img src={portrait} alt="" className="live-avatar-img" />
        
        <span className="live-avatar-light" aria-hidden="true" />
      </div>
      <div className="live-avatar-voiceline" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}
