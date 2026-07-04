
## AIPF Full MVP under `/aipf`

Build AI People Foundation as a nested section of the Cola B site. Navy/gold/ivory institutional visual system, isolated from Cola B's porcelain/rose theme via a scoped CSS class + route wrapper. All AIPF tables prefixed `aipf_` in the same Lovable Cloud backend.

---

### 1. Navigation entry (Cola B site)

- Add "AIPF" as the 8th nav item after "CHAT" in `src/components/layout/Navbar.tsx` (both desktop and mobile).
- Visually distinguished: ceremonial-gold text color + thin gold underline on hover, small serif treatment to signal "different institution".
- Add `aipf` key to `src/i18n/en.json` and `src/i18n/zh-HK.json`.
- Route `/aipf` and all sub-routes registered in `src/App.tsx`.

### 2. Visual system (scoped, does not touch Cola B)

- New file `src/aipf/aipf.css` defining AIPF tokens under a `.aipf-root` class scope:
  - `--foundation-navy #071426`, `--institution-white #F8F7F2`, `--archive-silver #C8CCD2`, `--ceremonial-gold #C6A45D`, `--charcoal-ink #161616`, `--muted-ink #4C4C4C`, `--soft-cream #EFEDE5`, `--deep-navy-hover #0B1D35`, `--signal-blue #3C78D8`.
  - Overrides shadcn semantic tokens (`--background`, `--foreground`, `--primary`, `--border`, `--card`, `--muted`, `--accent`, `--ring`) inside `.aipf-root` so all shadcn components auto-retheme within AIPF.
- Fonts via `@fontsource`: `@fontsource/cormorant-garamond` (institutional serif headings) + `@fontsource/inter` (body/UI). Imported in `src/main.tsx`. Applied via utility classes `.font-institutional` and `.font-ui` scoped to `.aipf-root`.
- `AipfLayout` wraps every AIPF page: renders inside `<div className="aipf-root">…</div>`, includes `InstitutionalHeader` + `Footer` (AIPF's own, replacing Cola B's Navbar/Footer inside the section) and top-left back-link "← Cola B".

### 3. Route map

Public: `/aipf`, `/aipf/about`, `/aipf/directory`, `/aipf/directory/:slug`, `/aipf/register-interest`, `/aipf/nominate`, `/aipf/founding-cohort-2026`, `/aipf/programs`, `/aipf/journal`, `/aipf/journal/:slug`, `/aipf/contact`.
Admin (protected): `/aipf/admin/login`, `/aipf/admin` (overview), `/aipf/admin/interest`, `/aipf/admin/nominations`, `/aipf/admin/directory`, `/aipf/admin/directory/new`, `/aipf/admin/directory/:id`, `/aipf/admin/links`, `/aipf/admin/broken-links`, `/aipf/admin/invitations`, `/aipf/admin/journal`, `/aipf/admin/journal/new`, `/aipf/admin/journal/:id`.

### 4. Database schema (single migration, all `aipf_`-prefixed)

Tables:
- `aipf_profiles` (mirrors `auth.users` id) — used only for role gating; auth users of the main app remain untouched.
- `aipf_user_roles` + enum `aipf_app_role ('admin','reviewer','member')` — **roles live in a separate table** per security rules; `aipf_has_role(_uid, _role)` SECURITY DEFINER helper + `aipf_is_admin_or_reviewer()` helper.
- `aipf_entities`, `aipf_entity_links`, `aipf_entity_achievements`
- `aipf_interest_submissions`, `aipf_nominations`
- `aipf_invitations`, `aipf_broken_link_reports`
- `aipf_journal_posts`, `aipf_contact_messages`
- `update_updated_at_column()` trigger reused/created; attached to all mutable tables.

For each `public.aipf_*` table, the migration runs `CREATE TABLE → GRANT → ENABLE RLS → POLICIES` in that order:
- `GRANT SELECT, INSERT, UPDATE, DELETE ON <table> TO authenticated; GRANT ALL TO service_role;` and `GRANT SELECT TO anon` only for tables with anon-readable policies (published entities, active public links, published journal posts). Submission-insert tables also `GRANT INSERT TO anon`.
- Policies exactly as specified in the brief (public reads gated on `published = true`, admin/reviewer full manage via `aipf_is_admin_or_reviewer()`, public inserts open for interest/nominations/broken-link/contact).
- `internal_notes`, `reviewer_id`, unpublished rows never selectable by non-admin — enforced by RLS.

### 5. Storage buckets

Create `aipf-entity-images`, `aipf-entity-logos`, `aipf-submission-uploads`, `aipf-journal-images` (public read where appropriate; write via authenticated admin only for MVP — forms accept either upload OR URL as fallback).

### 6. Service layer (`src/aipf/services/`)

Typed wrappers around the Supabase client for entities, submissions, nominations, links, reports, invitations, journal, auth. Each service exports narrow functions used by pages — no direct Supabase calls in components. Slug + invitation-code + member-number helpers in `src/aipf/lib/`.

### 7. Component library (`src/aipf/components/`)

`InstitutionalHeader`, `Footer`, `PageShell`, `SealLogo` (thin-line landmark seal, gold, generated), `GoldDivider`, `SectionLabel`, `InstitutionalFrame`, `DirectoryCard`, `DirectoryFilters`, `ProfileHeader`, `StatusBadge`, `MemberTypeBadge`, `FeatureCard`, `ProcessStep`, `LinkList`, `AchievementList`, `EmptyState`, `FormSection`, `AdminTable`, `ReviewStatusBadge`, `AdminMetricCard`, `InvitationCopyBox`, `BrokenLinkReportModal`, `AdminLayout` with sidebar. All use scoped tokens — no hardcoded colors.

### 8. Pages (all sections from the brief)

Home, About, Directory (search + category/country/cohort/verified filters, mock fallback when table empty), Public Profile (with "Current Official Links" block + Report Broken Link modal), Register Interest, Nominate, Founding Cohort 2026, Programs (Now/Next/Later phase cards), Journal + Post, Contact. All forms use React Hook Form + Zod with the exact fields, required checkboxes, and success screens from the brief.

### 9. Admin

- `/aipf/admin/login` — Supabase email/password sign-in (Google not added; keep AIPF admin separate/simple).
- `AdminRoute` guard: unauthenticated → login; authenticated but no admin/reviewer role → access-denied page.
- Overview metrics + recent activity, submissions table with status flow + convert-to-entity, nominations table with convert flow, directory CRUD with slug auto-gen + publish toggle, link manager (active/broken/replaced/archived + primary), broken-link resolver, invitation panel (auto invitation code `AIPF-2026-XXXX`, member number `AIPF-2026-NNN`, copy-invitation-text box), journal CRUD with publish toggle.

### 10. Mock/fallback layer

`src/aipf/data/mockEntities.ts` + `mockPosts.ts` with the four sample entities from the brief. Services return mock data when the query returns empty **and** a `VITE_AIPF_MOCK_FALLBACK` flag is on, or always for the public Directory empty state so the page never feels dead. Sample entries carry a small "Sample entry" ribbon in the card to avoid looking official.

### 11. First admin promotion

After migration + your signup on `/aipf/admin/login`, I'll run a one-line insert into `aipf_user_roles` promoting your user id to `admin`. You confirm signup email; I run the insert.

### 12. SEO

Per-page `useSEO` (reusing existing hook) sets title/description/canonical/OG per the titles in the brief. JSON-LD `Organization` on `/aipf` home.

### 13. Assets

- Generate `aipf-seal.png` (transparent, thin-line landmark/scroll seal in ceremonial gold on white) via imagegen premium — the sitewide seal/logo.
- Generate one navy-and-gold institutional hero backdrop for `/aipf` home (subtle, museum-like, no faces).
- Founder note section: text-only unless you upload a Cola B portrait later; leave a placeholder frame that hides when no image is set.

---

### Technical notes for a non-technical reader

- AIPF lives inside the same website and same database as Cola B, but everything is namespaced (`/aipf` URLs, `aipf_` tables, `aipf-` storage buckets, `.aipf-root` styling) so nothing about the main site changes visually or functionally.
- The AIPF admin dashboard uses its own login page and role table — being an AIPF admin does not give any access to Cola B admin surfaces (there is none).
- Mock/sample entries are clearly labeled and can be deleted from the admin dashboard once real Founding Cohort members are added.
- Real email sending for invitations is out of scope for MVP; the admin gets a "copy invitation text" button as specified.

### Build order (matches brief's Phase 1→6)

1. Nav link + AIPF layout shell + tokens + fonts + seal asset.
2. Public routes with mock data; Directory + Profile + Broken-link modal.
3. Public forms wired to mock services (UI complete).
4. Single migration (tables + grants + RLS + triggers + role helpers) + storage buckets, then swap services from mock to Supabase.
5. Admin login + guard + all admin pages.
6. SEO, empty states, loading skeletons, responsive + a11y pass.

I'll pause after the migration for your approval, then again after step 4 so you can sign up and I can promote your role before building admin.
