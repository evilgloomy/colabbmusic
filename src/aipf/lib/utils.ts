export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Two 4-character groups (~1.1 trillion combinations) so codes stay
// safe to redeem through the public claim endpoint. Uses the browser
// CSPRNG; excludes ambiguous characters (0/O, 1/I).
export function generateInvitationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const pick = (b: number) => chars.charAt(b % chars.length);
  const g1 = Array.from(bytes.slice(0, 4), pick).join("");
  const g2 = Array.from(bytes.slice(4), pick).join("");
  return `AIPF-2026-${g1}-${g2}`;
}

// Pass member numbers from BOTH entities and invitations — a number
// reserved on a drafted invitation must never be reissued.
export function nextMemberNumber(existingNumbers: (string | null | undefined)[]): string {
  const nums = existingNumbers
    .filter(Boolean)
    .map((n) => {
      const m = /AIPF-2026-(\d{3,})/.exec(n as string);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `AIPF-2026-${String(next).padStart(3, "0")}`;
}

export function normalizeMemberNumber(input: string): string {
  const cleaned = input.trim().toUpperCase().replace(/\s+/g, "");
  if (!cleaned) return "";
  // Accept bare numerics ("7", "007") as shorthand for AIPF-2026-007.
  if (/^\d{1,6}$/.test(cleaned)) {
    return `AIPF-2026-${cleaned.padStart(3, "0")}`;
  }
  return cleaned;
}

// Serialize structured link rows into the aipf_interest_submissions
// additional_links text column ("Platform: url" per line).
export function linksToText(links: { platform: string; url: string }[]): string {
  return links
    .filter((l) => l.url.trim())
    .map((l) => (l.platform.trim() ? `${l.platform.trim()}: ${l.url.trim()}` : l.url.trim()))
    .join("\n");
}

export function claimUrl(code: string): string {
  return `${window.location.origin}/aipf/claim?code=${encodeURIComponent(code)}`;
}

export function verifyUrl(memberNumber: string): string {
  return `https://colabbmusic.com/aipf/verify/${encodeURIComponent(memberNumber)}`;
}

export function invitationCopy(entityName: string, memberType?: string | null): string {
  const type = memberType || "Founding Member";
  return `You have been nominated for consideration as a ${type} of the AI People Foundation.

The Foundation recognizes AI native entities and creators helping shape the early era of digital culture.

We would be honored to invite ${entityName} to join the Founding Cohort 2026.

— AI People Foundation`;
}
