import { describe, it, expect } from "vitest";
import {
  slugify,
  generateInvitationCode,
  nextMemberNumber,
  normalizeMemberNumber,
} from "@/aipf/lib/utils";

describe("aipf utils", () => {
  describe("generateInvitationCode", () => {
    it("produces AIPF-2026-XXXX-XXXX with unambiguous characters", () => {
      for (let i = 0; i < 25; i++) {
        const code = generateInvitationCode();
        expect(code).toMatch(/^AIPF-2026-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
      }
    });

    it("does not repeat across a small sample", () => {
      const seen = new Set(Array.from({ length: 50 }, () => generateInvitationCode()));
      expect(seen.size).toBe(50);
    });
  });

  describe("nextMemberNumber", () => {
    it("starts at 001 when nothing exists", () => {
      expect(nextMemberNumber([])).toBe("AIPF-2026-001");
    });

    it("increments past the max across entities AND invitations", () => {
      const entityNumbers = ["AIPF-2026-001", "AIPF-2026-003"];
      const invitationNumbers = ["AIPF-2026-007", null, undefined];
      expect(nextMemberNumber([...entityNumbers, ...invitationNumbers])).toBe("AIPF-2026-008");
    });

    it("ignores malformed values", () => {
      expect(nextMemberNumber(["junk", "AIPF-2026-002", ""])).toBe("AIPF-2026-003");
    });
  });

  describe("normalizeMemberNumber", () => {
    it("expands bare numerics", () => {
      expect(normalizeMemberNumber("7")).toBe("AIPF-2026-007");
      expect(normalizeMemberNumber("012")).toBe("AIPF-2026-012");
    });

    it("uppercases and strips whitespace from full numbers", () => {
      expect(normalizeMemberNumber("  aipf-2026-001 ")).toBe("AIPF-2026-001");
    });

    it("returns empty for empty input", () => {
      expect(normalizeMemberNumber("   ")).toBe("");
    });
  });

  describe("slugify", () => {
    it("kebab-cases entity names", () => {
      expect(slugify("Echo Seraph")).toBe("echo-seraph");
      expect(slugify("  Æliah!! ")).toBe("liah");
    });
  });
});
