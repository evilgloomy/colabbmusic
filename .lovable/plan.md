

## Plan: Add Subscription Gate + Grok Mode for Chat with Cola B

### Problems
1. Anyone can sign up and chat freely — no payment required
2. Chat uses `chat-with-ai` (basic mode) instead of `chat-with-grok` (unrestricted Grok mode)
3. The `create-checkout` edge function's allowed origins don't include colabbmusic.com

### Solution

After sign-in, check subscription status via ArtistAgent.AI's `check-subscription` edge function. If the user doesn't have an active Ultra subscription, show the `PremiumGate` with a "Subscribe" button that calls the `create-checkout` edge function (tier: "ultra") and redirects to Stripe. Once subscribed, chat uses `chat-with-grok` instead of `chat-with-ai`.

### Changes

**1. `src/pages/ChatPage.tsx`** — Add subscription check + Grok mode
- After auth, call `artistAgent.functions.invoke('check-subscription')` to check subscription status
- New state: `subscriptionStatus` (null | object with `subscribed`, `subscription_tier`, etc.)
- If not subscribed → render `PremiumGate` instead of chat
- When sending messages, invoke `chat-with-grok` instead of `chat-with-ai`
- When creating new conversations, set `context: { model: 'grok' }` so the backend knows

**2. `src/components/chat/PremiumGate.tsx`** — Add Stripe checkout flow
- Replace the static link with a "Subscribe — $30/month" button
- On click: call `artistAgent.functions.invoke('create-checkout', { body: { isAnnual: false, tier: 'ultra' } })`
- Redirect to the returned Stripe checkout URL
- Add a secondary "Annual — $288/year (Save 20%)" option
- Show loading state during checkout creation

**3. `src/components/chat/ChatAuthForm.tsx`** — Minor copy update
- Update text to mention "Premium" / subscription requirement so users know before signing up

### Flow

```text
/chat → Auth check
  ├── Not signed in → ChatAuthForm (sign up/login)
  └── Signed in → check-subscription
        ├── Not subscribed → PremiumGate (Subscribe $30/mo button → Stripe)
        └── Subscribed (Ultra) → Chat UI (using chat-with-grok)
```

### Note on `create-checkout` allowed origins
The ArtistAgent.AI `create-checkout` function already sets `Access-Control-Allow-Origin: *` in CORS headers, so cross-origin calls from colabbmusic.com will work. However, the `successUrl`/`cancelUrl` logic only allows specific origins. Since we're calling from colabbmusic.com, the redirect after Stripe payment will fall back to the default URL. This is acceptable — after payment the user returns to ArtistAgent.AI and can revisit colabbmusic.com/chat.

### Files to modify
1. `src/pages/ChatPage.tsx` — subscription check + grok mode
2. `src/components/chat/PremiumGate.tsx` — Stripe checkout integration
3. `src/components/chat/ChatAuthForm.tsx` — copy update about premium requirement

