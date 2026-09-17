import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import portrait from "@/assets/campaign/portrait-close.jpg";
import type { LiveAvatarProps } from "@/live/lib/avatar";
import { realtimeAvatarBridge } from "@/live/avatar/realtimeAvatar";
import "@/live/avatar/realtimeAvatar.css";

/**
 * Cola's visual surface.
 *
 * When a LiveAvatar LITE session is available this component renders the actual
 * WebRTC media stream. The editorial portrait remains the graceful fallback for
 * configuration, network, or provider failures. We never fake lip sync with CSS.
 */
export default function LiveColaAvatar({
  state,
  emotion,
  amplitude,
  speaking,
  listening,
  className = "",
}: LiveAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatar = useSyncExternalStore(
    realtimeAvatarBridge.subscribe,
    realtimeAvatarBridge.getSnapshot,
    realtimeAvatarBridge.getSnapshot,
  );

  useEffect(() => {
    realtimeAvatarBridge.bindMediaElement(videoRef.current);
    return () => realtimeAvatarBridge.bindMediaElement(null);
  }, []);

  const showingRealtime = avatar.streamReady && (avatar.status === "connected" || avatar.status === "speaking");
  const level = showingRealtime ? 0 : speaking ? Math.max(0.08, Math.min(1, amplitude)) : 0;
  const thinking =
    state === "AURORA_PROCESSING" || state === "LEMO_PROCESSING" || state === "VOICE_CONNECTING";
  const errored = state === "ERROR";

  const mood = useMemo(() => {
    if (errored) return "error";
    if (speaking || avatar.status === "speaking") return "speaking";
    if (thinking) return "thinking";
    if (listening) return "listening";
    return "idle";
  }, [avatar.status, errored, listening, speaking, thinking]);

  const warmth = emotion?.warmth ?? 0.5;
  const energy = emotion?.energy ?? 0.4;

  return (
    <div
      className={`live-avatar ${className}`}
      data-mood={mood}
      data-realtime={showingRealtime ? "true" : "false"}
      style={
        {
          "--level": level.toFixed(3),
          "--warmth": warmth.toFixed(2),
          "--energy": energy.toFixed(2),
        } as React.CSSProperties
      }
      aria-label={`Cola B — ${mood}`}
    >
      <div className="live-avatar-aura" aria-hidden="true" />
      <div className="live-avatar-frame">
        <img
          src={portrait}
          alt="Cola B"
          className={`live-avatar-img ${showingRealtime ? "live-avatar-img-hidden" : ""}`}
        />
        <video
          ref={videoRef}
          className={`live-avatar-video ${showingRealtime ? "live-avatar-video-visible" : ""}`}
          autoPlay
          playsInline
          muted={false}
          aria-label="Cola B live avatar"
        />
        <span className="live-avatar-light" aria-hidden="true" />
        {avatar.status === "connecting" && !showingRealtime && (
          <span className="live-avatar-connecting" aria-hidden="true" />
        )}
      </div>

      {!showingRealtime && (
        <div className="live-avatar-voiceline" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} style={{ "--i": i } as React.CSSProperties} />
          ))}
        </div>
      )}
    </div>
  );
}
