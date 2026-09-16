import { useEffect, useRef } from "react";
import type { TranscriptTurn } from "@/live/lib/types";

export default function TranscriptView({
  turns,
  partial,
  dense = false,
}: {
  turns: TranscriptTurn[];
  partial?: string;
  dense?: boolean;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, partial]);

  return (
    <div className={dense ? "space-y-2" : "space-y-5"}>
      {turns.map((t) => (
        <div key={t.id}>
          <p className="live-eyebrow">
            {t.role === "cola" ? "Cola B" : t.role === "interviewer" ? "Interviewer" : "System"}
            {t.interrupted && <span className="live-accent"> · interrupted</span>}
            {t.source && t.source !== "aurora" && <span className="opacity-60"> · {t.source}</span>}
          </p>
          <p className={dense ? "text-sm" : "mt-1 text-base leading-relaxed"}>{t.content}</p>
        </div>
      ))}
      {partial && (
        <div className="opacity-60">
          <p className="live-eyebrow">Interviewer · partial</p>
          <p className={dense ? "text-sm" : "mt-1 text-base"}>{partial}</p>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
