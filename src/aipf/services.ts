import { supabase } from "@/integrations/supabase/client";
import type {
  AipfEntity,
  AipfEntityLink,
  AipfAchievement,
  AipfJournalPost,
  AipfClaimLookup,
  AipfOnboardingPayload,
  AipfOnboardingSubmission,
} from "./types";
import { mockEntities, mockPosts } from "./data/mock";

// Cast to any because these tables aren't in the generated Database type yet.
const db: any = supabase;

// --- ENTITIES (public) ---
export async function listPublishedEntities(): Promise<AipfEntity[]> {
  const { data, error } = await db.from("aipf_entities").select("*").eq("published", true).order("member_number", { ascending: true });
  if (error) return mockEntities;
  if (!data || data.length === 0) return mockEntities;
  return data as AipfEntity[];
}

export async function getEntityBySlug(slug: string): Promise<AipfEntity | null> {
  const { data, error } = await db.from("aipf_entities").select("*").eq("slug", slug).eq("published", true).maybeSingle();
  if (error || !data) {
    return mockEntities.find((e) => e.slug === slug) || null;
  }
  return data as AipfEntity;
}

export async function getEntityLinks(entityId: string): Promise<AipfEntityLink[]> {
  const { data, error } = await db.from("aipf_entity_links").select("*").eq("entity_id", entityId).order("priority", { ascending: false });
  if (error || !data) return [];
  return data as AipfEntityLink[];
}

export async function getEntityAchievements(entityId: string): Promise<AipfAchievement[]> {
  const { data, error } = await db.from("aipf_entity_achievements").select("*").eq("entity_id", entityId);
  if (error || !data) return [];
  return data as AipfAchievement[];
}

// --- ADMIN entities ---
export async function listAllEntities(): Promise<AipfEntity[]> {
  const { data, error } = await db.from("aipf_entities").select("*").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as AipfEntity[];
}
export async function getEntityById(id: string): Promise<AipfEntity | null> {
  const { data } = await db.from("aipf_entities").select("*").eq("id", id).maybeSingle();
  return (data as AipfEntity) || null;
}
export async function upsertEntity(payload: Partial<AipfEntity>) {
  if (payload.id) {
    return db.from("aipf_entities").update(payload).eq("id", payload.id).select().maybeSingle();
  }
  return db.from("aipf_entities").insert(payload).select().maybeSingle();
}
export async function deleteEntity(id: string) {
  return db.from("aipf_entities").delete().eq("id", id);
}

// --- LINKS ---
export async function listLinksForEntity(entityId: string): Promise<AipfEntityLink[]> {
  const { data } = await db.from("aipf_entity_links").select("*").eq("entity_id", entityId).order("priority", { ascending: false });
  return (data as AipfEntityLink[]) || [];
}
export async function upsertLink(payload: Partial<AipfEntityLink>) {
  if (payload.id) return db.from("aipf_entity_links").update(payload).eq("id", payload.id);
  return db.from("aipf_entity_links").insert(payload);
}
export async function deleteLink(id: string) {
  return db.from("aipf_entity_links").delete().eq("id", id);
}

// --- SUBMISSIONS ---
export async function createInterestSubmission(payload: Record<string, unknown>) {
  return db.from("aipf_interest_submissions").insert(payload);
}
export async function listInterestSubmissions() {
  const { data } = await db.from("aipf_interest_submissions").select("*").order("created_at", { ascending: false });
  return data || [];
}
export async function updateInterestSubmission(id: string, patch: Record<string, unknown>) {
  return db.from("aipf_interest_submissions").update(patch).eq("id", id);
}

// --- NOMINATIONS ---
export async function createNomination(payload: Record<string, unknown>) {
  return db.from("aipf_nominations").insert(payload);
}
export async function listNominations() {
  const { data } = await db.from("aipf_nominations").select("*").order("created_at", { ascending: false });
  return data || [];
}
export async function updateNomination(id: string, patch: Record<string, unknown>) {
  return db.from("aipf_nominations").update(patch).eq("id", id);
}

// --- MEMBER CLAIM / ONBOARDING ---
// These call security-definer RPCs added by the aipf_member_claim_flow
// migration. Until that migration is applied, calls fail and callers
// surface a "not yet available" state.
export async function lookupInvitation(code: string): Promise<AipfClaimLookup | { unavailable: true }> {
  try {
    const { data, error } = await db.rpc("aipf_lookup_invitation", { _code: code.trim() });
    if (error) return { unavailable: true };
    return (data as AipfClaimLookup) ?? { found: false };
  } catch {
    return { unavailable: true };
  }
}

export async function submitOnboarding(code: string, payload: AipfOnboardingPayload) {
  try {
    const { data, error } = await db.rpc("aipf_submit_onboarding", {
      _code: code.trim(),
      _payload: payload,
    });
    if (error) return { ok: false, error: "unavailable" as const };
    return data as { ok: boolean; error?: string; submission_id?: string; member_number?: string | null };
  } catch {
    return { ok: false, error: "unavailable" as const };
  }
}

export async function listOnboardingSubmissions(): Promise<AipfOnboardingSubmission[]> {
  try {
    const { data } = await db
      .from("aipf_onboarding_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    return (data as AipfOnboardingSubmission[]) || [];
  } catch {
    return [];
  }
}

export async function approveOnboarding(submissionId: string) {
  try {
    const { data, error } = await db.rpc("aipf_approve_onboarding", { _submission_id: submissionId });
    if (error) return { ok: false, error: error.message };
    return data as { ok: boolean; error?: string; entity_id?: string; slug?: string; member_number?: string };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network error" };
  }
}

export async function rejectOnboarding(submissionId: string, note: string) {
  return db
    .from("aipf_onboarding_submissions")
    .update({ status: "rejected", internal_notes: note || null })
    .eq("id", submissionId);
}

// --- REGISTRY VERIFICATION ---
// Deliberately queries the database directly with NO mock fallback:
// a verification surface must never "verify" sample data. A query
// error reads as "unavailable", an empty result as "no record".
export async function findEntityByMemberNumber(
  memberNumber: string
): Promise<{ entity: AipfEntity | null; unavailable?: boolean }> {
  const normalized = memberNumber.trim().toUpperCase();
  if (!normalized) return { entity: null };
  try {
    const { data, error } = await db
      .from("aipf_entities")
      .select("*")
      .eq("published", true)
      .ilike("member_number", normalized)
      .maybeSingle();
    if (error) return { entity: null, unavailable: true };
    return { entity: (data as AipfEntity) || null };
  } catch {
    return { entity: null, unavailable: true };
  }
}

// --- BROKEN LINK REPORTS ---
export async function createBrokenLinkReport(payload: Record<string, unknown>) {
  return db.from("aipf_broken_link_reports").insert(payload);
}
export async function listBrokenLinkReports() {
  const { data } = await db.from("aipf_broken_link_reports").select("*, aipf_entities(entity_name, slug)").order("created_at", { ascending: false });
  return data || [];
}
export async function resolveBrokenLinkReport(id: string, resolved: boolean) {
  return db.from("aipf_broken_link_reports").update({ resolved }).eq("id", id);
}

// --- INVITATIONS ---
export async function listInvitations() {
  const { data } = await db.from("aipf_invitations").select("*").order("created_at", { ascending: false });
  return data || [];
}
export async function createInvitation(payload: Record<string, unknown>) {
  return db.from("aipf_invitations").insert(payload);
}
export async function updateInvitation(id: string, patch: Record<string, unknown>) {
  return db.from("aipf_invitations").update(patch).eq("id", id);
}

// --- JOURNAL ---
export async function listPublishedPosts(): Promise<AipfJournalPost[]> {
  const { data, error } = await db.from("aipf_journal_posts").select("*").eq("published", true).order("created_at", { ascending: false });
  if (error || !data || data.length === 0) return mockPosts;
  return data as AipfJournalPost[];
}
export async function listAllPosts(): Promise<AipfJournalPost[]> {
  const { data } = await db.from("aipf_journal_posts").select("*").order("created_at", { ascending: false });
  return (data as AipfJournalPost[]) || [];
}
export async function getPostBySlug(slug: string): Promise<AipfJournalPost | null> {
  const { data } = await db.from("aipf_journal_posts").select("*").eq("slug", slug).eq("published", true).maybeSingle();
  if (data) return data as AipfJournalPost;
  return mockPosts.find((p) => p.slug === slug) || null;
}
export async function getPostById(id: string): Promise<AipfJournalPost | null> {
  const { data } = await db.from("aipf_journal_posts").select("*").eq("id", id).maybeSingle();
  return (data as AipfJournalPost) || null;
}
export async function upsertPost(payload: Partial<AipfJournalPost>) {
  if (payload.id) return db.from("aipf_journal_posts").update(payload).eq("id", payload.id);
  return db.from("aipf_journal_posts").insert(payload);
}
export async function deletePost(id: string) {
  return db.from("aipf_journal_posts").delete().eq("id", id);
}

// --- CONTACT ---
export async function createContactMessage(payload: Record<string, unknown>) {
  return db.from("aipf_contact_messages").insert(payload);
}
export async function listContactMessages() {
  const { data } = await db.from("aipf_contact_messages").select("*").order("created_at", { ascending: false });
  return data || [];
}

// --- OVERVIEW METRICS ---
export async function getOverviewMetrics() {
  const tables = [
    "aipf_interest_submissions",
    "aipf_nominations",
    "aipf_entities",
    "aipf_invitations",
    "aipf_broken_link_reports",
    "aipf_journal_posts",
    "aipf_contact_messages",
  ];
  const counts: Record<string, number> = {};
  await Promise.all(
    tables.map(async (t) => {
      const { count } = await db.from(t).select("*", { count: "exact", head: true });
      counts[t] = count || 0;
    })
  );
  return counts;
}
