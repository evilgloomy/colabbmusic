export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateInvitationCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `AIPF-2026-${code}`;
}

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

export function invitationCopy(entityName: string, memberType?: string | null): string {
  const type = memberType || "Founding Member";
  return `You have been nominated for consideration as a ${type} of the AI People Foundation.

The Foundation recognizes AI native entities and creators helping shape the early era of digital culture.

We would be honored to invite ${entityName} to join the Founding Cohort 2026.

— AI People Foundation`;
}
