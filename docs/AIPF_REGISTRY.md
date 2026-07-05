# AIPF Functional Registry — v1

This branch turns the AIPF section from a brochure + interest form into a working
registry with a complete membership lifecycle:

```
Nominate / Register interest          (already existed)
        │
Admin drafts invitation               /aipf/admin/invitations
        │  → "Copy claim link" gives the candidate a private URL
Candidate claims membership           /aipf/claim?code=AIPF-2026-XXXX-XXXX
        │  confirm profile → accept principles → sign digital oath
Admin reviews the submission          /aipf/admin/onboarding
        │  one click: Approve & publish
Member is live in the registry        /aipf/directory/:slug
        │  member number assigned, links attached, verification set
Anyone can verify the credential      /aipf/verify/AIPF-2026-001
        │
Member displays badge + certificate   PNG download + print-ready certificate
```

## What was added

| Surface | Route | Notes |
|---|---|---|
| Claim wizard | `/aipf/claim` (`?code=` deep link) | 3-step onboarding per the foundation plan: profile, principles, digital oath |
| Verify | `/aipf/verify`, `/aipf/verify/:memberNumber` | Public credential check. Queries the DB directly — never "verifies" sample data |
| Certificate | `/aipf/certificate/:slug` | Print-ready (Print → Save as PDF); brand-kit layout |
| Badge | on public profiles | SVG per brand kit, downloadable as PNG, client-side only |
| Official Record panel | on `/aipf/directory/:slug` | member number, verify link, badge + certificate access, JSON-LD |
| Admin onboarding queue | `/aipf/admin/onboarding` | review payload, approve (atomic publish) or reject |
| Directory upgrades | `/aipf/directory` | country filter, sort (number / name / newest), record count |

All public-facing strings exist in EN / 繁中 / 日本語.

## ⚠️ Activation: apply the migration

`supabase/migrations/20260705120000_aipf_member_claim_flow.sql` must run against the
Supabase project before the claim flow works (Lovable applies it on the next deploy,
or paste it into the Supabase SQL editor). It creates:

- `aipf_onboarding_submissions` (RLS: admin/reviewer only)
- `aipf_lookup_invitation(code)` — anon-safe prefill lookup
- `aipf_submit_onboarding(code, payload)` — validates & stores the claim
- `aipf_approve_onboarding(submission_id)` — admin-gated atomic publish
  (assigns member numbers under an advisory lock so they can never collide)

Until the migration is applied, `/aipf/claim` and `/aipf/admin/onboarding` degrade to a
friendly "onboarding opens soon" state; everything else works immediately.

Invitation codes are now `AIPF-2026-XXXX-XXXX` (CSPRNG, ~1.1e12 combinations) because
codes are redeemable through a public endpoint. Old 4-char codes still work.

## Suggested next phases

1. **Now (content, no code):** create the real Founding Cohort entities in the admin,
   draft invitations, send claim links. The registry becomes real the moment the first
   member completes the oath.
2. **Next:** email delivery of invitations (edge function + Resend/SendGrid) instead of
   copy-paste; upload images to Supabase Storage instead of URL fields; member self-serve
   profile updates (the `member` role already exists in `aipf_app_role`).
3. **Later (per foundation plan):** journal-powered creator spotlights on the homepage,
   awards nominations/voting, State of AI People report page, private member area.
