import { useEffect, useMemo, useRef, useState } from "react";
import portrait from "@/assets/campaign/portrait-close.jpg";
import type { LiveAvatarProps } from "@/live/lib/avatar";

/**
 * Cola's live presence. Web-native and low latency: idle breathing, semi-random
 * blink, state-driven lighting and an amplitude-reactive speaking treatment.
 * No cartoon mouth overlay — the face is never distorted.
 * Swappable for a realtime viseme / Live2D / WebGL avatar via LiveAvatarProps.
 */
export default function LiveColaAvatar({
  state,
  emotion,
  amplitude,
  speaking,
  listening,
  className = "",
}: LiveAvatarProps) {
  const [blink, setBlink] = useState(false);
  const timer = useRef<number>();

  useEffect(() => {
    const schedule = () => {
      const delay = 2600 + Math.random() * 4200;
      timer.current = window.setTimeout(() => {
        setBlink(true);
        window.setTimeout(() => setBlink(false), 130);
        schedule();
      }, delay);
    };
    schedule();
    return () => window.clearTimeout(timer.current);
  }, []);

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
      data-blink={blink}
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
        <span className="live-avatar-eyelids" aria-hidden="true" />
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
