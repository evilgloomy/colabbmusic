

## Plan: Add "Chat with Cola B" — Embedded ArtistAgent.ai Experience

### Summary

Add a new **Chat** page to colabbmusic.com that embeds the Cola B character chat from artistagent.ai in an iframe. All authentication, premium gating, payments (LEMO), and Aurora Brain memory are handled by artistagent.ai — this site just provides the frame and navigation entry point.

### How It Works

1. User clicks "Chat" in the nav
2. A full-height iframe loads `https://artistagent.ai/chat/cola-b` (or whatever Cola B's character ID is on that platform)
3. ArtistAgent.ai handles everything: sign-up, premium gating, payment via LEMO, Aurora Brain memory
4. The page is styled to match colabbmusic.com's aesthetic with a seamless full-bleed embed

### Changes

**1. `src/pages/ChatPage.tsx`** (new file)
- Full-viewport iframe pointing to the Cola B chat on artistagent.ai
- Minimal chrome: just the navbar + a full-height iframe below
- Loading state while iframe loads
- Uses `PageLayout` but with `hideFooter` since the chat is full-height

**2. `src/components/layout/Navbar.tsx`**
- Add `{ label: "Chat", path: "/chat" }` to `navItems` array

**3. `src/App.tsx`**
- Add route: `<Route path="/chat" element={<ChatPage />} />`

### Key Detail

The iframe URL needs to point to Cola B's character on artistagent.ai. Based on the ArtistAgent.AI project's routing pattern (`/chat/:characterId`), the URL would be something like `https://artistagent.ai/chat/cola-b` — I'll need you to confirm the exact character ID and published domain.

### What ArtistAgent.ai Handles (no work needed here)
- User authentication and sign-up
- Premium subscription gating
- LEMO payment gateway
- Aurora Brain memory system
- All chat logic and AI responses

### Files to create/modify
1. **`src/pages/ChatPage.tsx`** — new iframe embed page
2. **`src/components/layout/Navbar.tsx`** — add Chat nav item
3. **`src/App.tsx`** — add /chat route

