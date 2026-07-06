import { useState } from "react";
import { SectionLabel } from "./Chrome";
import { useAipfT } from "@/aipf/i18n";

// The prompt is intentionally English-only (generation models respond
// best to English); the surrounding labels are translated.
export function officialPortraitPrompt(entityName?: string, category?: string) {
  const name = entityName?.trim() || "[ENTITY NAME]";
  // "AI Musician" → "musician" so the sentence reads "an AI-native musician"
  const cat = (category?.trim() || "digital entity").replace(/^AI\s+/i, "").toLowerCase();
  return `Official archival portrait of ${name}, an AI-native ${cat}. Head-and-shoulders composition, subject centered, gaze slightly off-camera, vertical 3:4 format. Soft directional studio lighting with gentle shadow falloff. Plain deep-navy studio backdrop with a subtle vignette. Calm, dignified, timeless mood — like a museum or academy portrait. Photorealistic editorial quality, high detail. No text, no logos, no watermarks, no borders, no neon, no clutter.`;
}

export function PortraitGuidelines({
  entityName,
  category,
}: {
  entityName?: string;
  category?: string;
}) {
  const { t } = useAipfT();
  const [copied, setCopied] = useState(false);
  const prompt = officialPortraitPrompt(entityName, category);

  const requirements = [
    t("portrait.r1"),
    t("portrait.r2"),
    t("portrait.r3"),
    t("portrait.r4"),
    t("portrait.r5"),
    t("portrait.r6"),
  ];

  return (
    <div className="border border-[hsl(var(--ceremonial-gold))/0.5] bg-[hsl(var(--soft-cream))/0.5] p-5">
      <SectionLabel>{t("portrait.label")}</SectionLabel>
      <p className="text-xs text-foreground/75 mt-2">{t("portrait.intro")}</p>
      <ul className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-foreground/80">
        {requirements.map((r) => (
          <li key={r} className="flex gap-2">
            <span style={{ color: "hsl(var(--ceremonial-gold))" }}>✦</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-[hsl(var(--ceremonial-gold))/0.4] pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="aipf-label !text-[0.62rem]">{t("portrait.promptLabel")}</div>
          <button
            type="button"
            className="text-[0.68rem] uppercase tracking-[0.14em] aipf-link"
            onClick={() => {
              navigator.clipboard.writeText(prompt);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? t("portrait.copied") : t("portrait.copy")}
          </button>
        </div>
        <p className="mt-2 font-mono text-[0.7rem] leading-relaxed text-foreground/70 bg-background border border-border p-3 select-all">
          {prompt}
        </p>
        <p className="mt-2 text-[0.68rem] text-muted-foreground italic">{t("portrait.note")}</p>
      </div>
    </div>
  );
}
