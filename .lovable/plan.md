

## Plan: Native "Chat with Cola B" — Powered by ArtistAgent.AI Backend

### Summary

Replace the current iframe with a fully native chat experience on colabbmusic.com. Users sign up, log in, and chat directly on the site. Under the hood, a second Supabase client connects to the ArtistAgent.AI backend for all auth, conversations, messages, and AI processing (including LEMO, Aurora Brain, token system).

Cola B's character ID will be looked up at runtime by querying `characters` table with `name = 'Cola B'` from the ArtistAgent.AI database.

### Architecture

```text
colabbmusic.com (React frontend)
  ├── ArtistAgent Supabase Client (2nd client)
  │     → auth.signUp / signIn / getSession
  │     → characters table (lookup Cola B)
  │     → conversations table (create/find)
  │     → messages table (read/write)
  │     → chat-with-ai edge function
  │     → check-subscription edge function
  └── Cola B Supabase Client (existing, unchanged)
        → releases, stories, streaming_links
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/artistAgent.ts` | Second Supabase client pointing to ArtistAgent.AI project (`tiuyxkgguvjbmdeyybcg.supabase.co`) |
| `src/contexts/ArtistAgentAuth.tsx` | Auth context using ArtistAgent.AI's auth system — signUp, signIn, signOut, session state |
| `src/components/chat/ChatAuthForm.tsx` | Native sign-up/login form styled with Cola B's champagne/lavender theme |
| `src/components/chat/ChatMessages.tsx` | Message list rendering user + character messages with markdown support |
| `src/components/chat/ChatInput.tsx` | Text input with send button |
| `src/components/chat/PremiumGate.tsx` | Shown when subscription check fails — CTA to upgrade on ArtistAgent.AI |
| `src/components/chat/TypingIndicator.tsx` | "Cola B is thinking..." animation |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/ChatPage.tsx` | Rewrite: replace iframe with native auth check → chat UI. Query `characters` by name to get Cola B's ID, find/create conversation, render messages, send via `chat-with-ai` edge function |
| `src/App.tsx` | Wrap `AppInner` with `ArtistAgentAuthProvider` |

### Chat Flow

1. User visits `/chat` → `ArtistAgentAuthProvider` checks for existing session on ArtistAgent.AI's auth
2. **Not signed in** → Show `ChatAuthForm` (email/password sign-up or login) → calls `artistAgentClient.auth.signUp()` / `signInWithPassword()`
3. **Signed in** → Query `characters` table: `SELECT * FROM characters WHERE name = 'Cola B' LIMIT 1`
4. Find or create a conversation in `conversations` table for this user + character
5. Fetch existing messages from `messages` table
6. On send: save user message to `messages`, invoke `chat-with-ai` edge function, save AI response to `messages`
7. **Premium gate**: Call `check-subscription` edge function. If not subscribed, show upgrade prompt linking to ArtistAgent.AI's checkout

### Key Details

- **ArtistAgent.AI Supabase URL**: `https://tiuyxkgguvjbmdeyybcg.supabase.co`
- **ArtistAgent.AI Anon Key**: from the client file (already public)
- **CORS**: ArtistAgent.AI edge functions already set `Access-Control-Allow-Origin: *`
- **No dependency on Cola B's UUID** — looked up at runtime by name
- **react-markdown** package needed for rendering AI responses
- **Styling**: All components use Cola B's existing design tokens (champagne gold primary, lavender accents, Sora font)
- **Auth is separate**: ArtistAgent.AI auth is completely independent from any Cola B site auth

