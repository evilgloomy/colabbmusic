

## Plan: Pull Story Content from Cola's Threads Account + AI-Enhanced Posts

### Overview
Replace the hardcoded story entries with dynamic content pulled from Cola B's Threads account (`@cola_bb_official`), stored in the database, and enhanced with AI-generated captions/descriptions for a polished editorial feel.

### Architecture

```text
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│  Threads API    │────▶│  Edge Function:       │────▶│  stories    │
│  (Meta Graph)   │     │  sync-threads-posts   │     │  table (DB) │
└─────────────────┘     │  + Lovable AI rewrite │     └──────┬──────┘
                        └──────────────────────┘            │
                                                    ┌───────▼───────┐
                                                    │  Story page   │
                                                    │  (frontend)   │
                                                    └───────────────┘
```

### Challenge: Threads API Authentication
The Threads API requires OAuth (a Meta developer app + user access token). Cola B would need to:
1. Create a Meta Developer App (or we use an existing one)
2. Authorize the app to access her Threads account
3. Generate a long-lived access token

This token gets stored as a backend secret (`THREADS_ACCESS_TOKEN`) and used by the edge function.

### Step-by-step

**1. Database: Create `stories` table**
- `id`, `threads_post_id` (unique, from Threads), `original_text`, `ai_enhanced_text`, `ai_title`, `category` (AI-classified), `media_url`, `media_type`, `permalink`, `timestamp`, `location` (AI-extracted if mentioned), `featured`, `created_at`
- RLS: public read, no public write

**2. Edge Function: `sync-threads-posts`**
- Calls `GET https://graph.threads.net/v1.0/me/threads?fields=id,text,media_url,media_type,permalink,timestamp,thumbnail_url`
- For each new post (not already in DB by `threads_post_id`):
  - Sends the original text to Lovable AI (gemini-3-flash-preview) with a prompt like: *"You are Cola B's editorial assistant. Rewrite this Threads post into a polished story card. Return a JSON with: title, enhanced_caption, category (one of: music/travel/fashion/events/studio/lifestyle/humor), and location (if mentioned, else null)."*
  - Inserts the result into the `stories` table
- Handles pagination for full history on first sync

**3. Update Story page (`src/pages/Story.tsx`)**
- Fetch from `stories` table instead of static `storyEntries`
- Keep the same card grid UI and category filter
- Use `media_url` for images, `ai_title` for title, `ai_enhanced_text` for caption

**4. Update `StoryPreview` homepage component**
- Pull 3 featured/recent stories from DB instead of static data

**5. Secret required**
- `THREADS_ACCESS_TOKEN` — Cola B's long-lived Threads API token
- We'll walk through obtaining this from Meta Developer Console

### What the user needs to do
- Register a Meta Developer App at developers.facebook.com
- Add the Threads API product
- Authorize Cola's account and generate a long-lived token
- Provide the token when prompted

### Technical details
- Edge function uses `LOVABLE_API_KEY` (already available) for AI enhancement
- Threads API rate limit: 1,000 requests per 24h — sufficient for periodic syncs
- The sync can be triggered manually or on a schedule via a simple admin button
- `config.toml` updated with `verify_jwt = false` for the new function

