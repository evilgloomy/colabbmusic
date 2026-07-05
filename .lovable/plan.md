## What I found

Your account is fine at the database level:

- **User exists & email confirmed**: `cola.bb.225@gmail.com` (confirmed 2026-07-04 20:34:26)
- **Admin role assigned**: `admin` role in `aipf_user_roles`
- **Last successful sign-in**: 2026-07-04 20:34:59 — meaning the password *did* work at least once after signup

So this is almost certainly a forgotten/mistyped password, **not** a broken function. The problem is that the AIPF admin login page has **no "Forgot password" flow**, so there's no way to recover.

## Plan

### 1. Add password reset to AIPF admin
- Add a **"Forgot password?"** link on `src/aipf/pages/AdminLogin.tsx`
- Create `src/aipf/pages/AdminForgotPassword.tsx` — calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: <origin>/aipf/admin/reset-password })`
- Create `src/aipf/pages/AdminResetPassword.tsx` — detects the `type=recovery` hash, prompts for a new password, calls `supabase.auth.updateUser({ password })`
- Register both routes in the AIPF router (public, no guard)

### 2. Immediate unblock for you
While you're locked out, I can either:
- **(a)** Reset your password directly to a temporary value via an admin migration, then you change it after signing in, **or**
- **(b)** You use the new "Forgot password" flow once step 1 ships and check your inbox for the reset email

### 3. Sanity-check the other AIPF admin functions
Once you're back in, quickly verify each admin screen loads and its underlying service call works:
- Overview metrics (`getOverviewMetrics`)
- Interest submissions list
- Nominations list
- Directory (entities CRUD)
- Broken link reports
- Invitations
- Journal posts CRUD

I'll do this with a headless browser pass after login and report any endpoint that errors — no code changes unless something actually fails.

## Question before I build

Which unblock do you want — **(a) temporary password reset now**, or **(b) wait for the forgot-password email flow**?
