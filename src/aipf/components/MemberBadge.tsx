import { useRef, useState } from "react";
import type { AipfEntity } from "@/aipf/types";
import { Button } from "@/components/ui/button";
import { useAipfT } from "@/aipf/i18n";
import sealImg from "@/aipf/assets/aipf-seal.png";

const NAVY = "#071426";
const GOLD = "#C6A45D";
const SILVER = "#C8CCD2";
const WHITE = "#F8F7F2";
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";

function shortNumber(memberNumber: string | null): string {
  if (!memberNumber) return "";
  const m = /(\d{3,})$/.exec(memberNumber);
  return m ? `No. ${m[1]}` : memberNumber;
}

/**
 * Official member badge rendered as SVG (per the AIPF brand kit:
 * seal, member type, year, member number, verification mark).
 * The same markup is serialized for the PNG download; the seal is
 * inlined as a data URI because SVG rasterized through an <img>
 * cannot load external resources.
 */
export function MemberBadge({ e }: { e: AipfEntity }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const isVerified = ["verified", "official", "identity_reviewed"].includes(e.verification_status);
  const yearLabel = e.founding_cohort ? "Cohort 2026" : "Est. 2026";

  return (
    <svg
      ref={svgRef}
      data-aipf-badge
      viewBox="0 0 800 280"
      role="img"
      aria-label={`AIPF member badge for ${e.entity_name}`}
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <rect x="0" y="0" width="800" height="280" fill={NAVY} />
      <rect x="6" y="6" width="788" height="268" fill="none" stroke={GOLD} strokeWidth="2.5" />
      <rect x="16" y="16" width="768" height="248" fill="none" stroke={GOLD} strokeWidth="0.75" opacity="0.55" />

      <image href={sealImg} x="44" y="60" width="160" height="160" />

      <text x="248" y="92" fill={GOLD} fontFamily={SERIF} fontSize="30" letterSpacing="4" style={{ textTransform: "uppercase" }}>
        {(e.member_type || "Member").toUpperCase()}
      </text>
      <text x="248" y="140" fill={WHITE} fontFamily={SERIF} fontSize="36" letterSpacing="1.5">
        AI People Foundation
      </text>
      <line x1="248" y1="164" x2="470" y2="164" stroke={GOLD} strokeWidth="1" opacity="0.8" />
      <text x="248" y="198" fill={SILVER} fontFamily={SERIF} fontSize="23" fontStyle="italic" letterSpacing="1">
        {yearLabel}
      </text>
      <text x="248" y="240" fill={WHITE} fontFamily={SERIF} fontSize="27" letterSpacing="3">
        {shortNumber(e.member_number)}
      </text>
      <text x="470" y="240" fill={SILVER} fontFamily={SERIF} fontSize="15" letterSpacing="1.5" opacity="0.75">
        {e.member_number || ""}
      </text>

      {isVerified && (
        <g>
          <circle cx="732" cy="228" r="22" fill="none" stroke={GOLD} strokeWidth="1.75" />
          <path d="M722 228 l7 8 l14 -16" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}

async function assetToDataUri(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function downloadBadgePng(entityName: string, scale = 2): Promise<void> {
  const svg = document.querySelector("svg[data-aipf-badge]") as SVGSVGElement | null;
  if (!svg) return;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(800 * scale));
  clone.setAttribute("height", String(280 * scale));

  const image = clone.querySelector("image");
  if (image) {
    const dataUri = await assetToDataUri(sealImg);
    image.setAttribute("href", dataUri);
  }

  const svgBlob = new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("badge render failed"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 800 * scale;
    canvas.height = 280 * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const png: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!png) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(png);
    a.download = `AIPF-badge-${entityName.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function BadgeDownloadButton({ e }: { e: AipfEntity }) {
  const { t } = useAipfT();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await downloadBadgePng(e.entity_name);
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? t("common.loading") : t("record.downloadBadge")}
    </Button>
  );
}
