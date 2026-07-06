# Activate the AIPF Member Claim Flow

## What Claude shipped (already in the code)
Commit `57cdd60` added the full registry lifecycle:
- `/aipf/claim` — invitation-code wizard, profile confirmation, principles, digital oath
- `/aipf/verify/:memberNumber` — public verification against the registry
- `/aipf/certificate/:slug` — print-ready certificate + brand-kit badge (`MemberBadge`)
- `/aipf/admin/onboarding` — approve/reject queue
- Directory filters/sort, JSON-LD on public profiles, EN/ZH/JA i18n, unit tests, docs

All frontend pieces are present and building.

## The gap
The SQL migration `supabase/migrations/20260705120000_aipf_member_claim_flow.sql` (333 lines) was **committed but never applied** to the backend. I verified against the live DB:
- Table `public.aipf_onboarding_submissions` — missing
- Functions `aipf_lookup_invitation`, `aipf_submit_onboarding`, `aipf_approve_onboarding` — missing

Because the service layer wraps every RPC in `try/catch` returning `{ unavailable: true }`, the UI *looks* fine but:
- Claim wizard step 1 will always say "invitation not found / unavailable"
- Submitting a claim silently fails
- Admin onboarding queue is permanently empty
- Approve/reject buttons do nothing

## Plan
1. Read the pending migration file `supabase/migrations/20260705120000_aipf_member_claim_flow.sql` end-to-end.
2. Verify it follows house rules (GRANTs on every new public table, RLS enabled, policies present, security-definer functions have `set search_path = public`).
3. Apply the migration via the Cloud migration tool.
4. Re-query the DB to confirm the table + 3 RPCs now exist.
5. Smoke-test end-to-end with Playwright against the running preview:
   - Create a test invitation in `/aipf/admin/invitations`
   - Walk the claim wizard at `/aipf/claim?code=...` through all 4 steps
   - Confirm the submission appears in `/aipf/admin/onboarding`
   - Approve it and confirm the entity gets published with a member number
   - Hit `/aipf/verify/<member_number>` and confirm it verifies

## Not in scope
- No changes to the frontend Claude shipped — it's already wired correctly against these RPCs.
- No password reset work; the earlier forgot-password flow is unrelated and already live.
- If the migration fails linter checks, I'll patch it in the same turn before applying.

Approve to proceed and I'll apply + verify.
