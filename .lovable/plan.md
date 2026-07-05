## Use the reset-password flow I just shipped

Your credentials are definitely wrong (Supabase is rejecting them), but your account itself is intact — same admin role, same confirmed email. You just need to set a new password.

### Do this now
1. Go to **`/aipf/admin/login`**
2. Click **"Forgot password?"** (the new link at the bottom of the sign-in card)
3. Enter `cola.bb.225@gmail.com` and submit
4. Open the email from Lovable/Supabase (check spam if not in inbox within ~2 min), click the link
5. You'll land on `/aipf/admin/reset-password` — set a new password → you're in

### If the reset email never arrives
Tell me and I'll take one of these fallback paths (needs your go-ahead — I won't touch the auth schema without it):

- **(A) Send you a one-time magic link** — I'd build a tiny admin-only edge function that uses the service role to generate a recovery link for your email, then paste the link back to you here. No password needed.
- **(B) Delete the account and re-create** — you sign up again with the same email + a new password you'll remember; I re-grant the admin role by user_id. You lose nothing because there's no personal data attached.

**Which fallback do you want queued up in case the email doesn't arrive — (A) magic link or (B) re-signup?**
