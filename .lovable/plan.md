

## Plan: Individual Story Pages with SEO

### What changes

**1. Create individual story detail page (`src/pages/StoryDetail.tsx`)**
- New route `/story/:id` showing the full story post on Cola B's own site
- Displays the Threads media (image/video) directly from the `media_url` stored in the database (already fetched from Threads API)
- Shows AI-enhanced title, text, category, location, date, and original text
- "View on Threads" link as secondary action (not the primary experience)
- Back navigation to `/story`
- Dynamic `<title>` and `<meta>` tags for SEO using `document.title` and meta tag manipulation in a `useEffect`

**2. Add SEO meta tags per story**
- Set `document.title` to `"{ai_title} — Cola B"` on mount
- Inject/update Open Graph meta tags (`og:title`, `og:description`, `og:image`, `og:url`) and Twitter card tags dynamically
- Clean up on unmount to restore defaults
- Note: Since this is a client-rendered SPA, full SSR-level SEO isn't possible, but dynamic meta tags work for social sharing crawlers that execute JS (Facebook, Twitter/X, Threads)

**3. Update Story grid page (`src/pages/Story.tsx`)**
- Change `StoryCard` links from `href={story.permalink}` (external Threads link) to `<Link to={/story/${story.id}}>` (internal route)
- Remove the Unsplash fallback image — if no `media_url`, show a styled text-only card instead
- Remove `target="_blank"` since everything stays on-site

**4. Update StoryPreview homepage component (`src/components/home/StoryPreview.tsx`)**
- Link each story preview card to `/story/:id` instead of being unlinked

**5. Add route to App.tsx**
- Add `<Route path="/story/:id" element={<StoryDetailPage />} />`

**6. Fix deduplication bug in edge function (`supabase/functions/sync-threads-posts/index.ts`)**
- The existing ID lookup queries `threads_post_id` but the dedup filter compares against `post.id` — these are actually the same field, but the query returns objects with `threads_post_id` key while the Set is built from that. The real issue: the `select` returns full objects but the Set maps `e.threads_post_id`. This looks correct. The actual problem is the function uses `insert` instead of `upsert`, so re-runs fail on the unique constraint. Change to `upsert` with `onConflict: 'threads_post_id'` to cleanly handle re-syncs.

### Technical details

- **Media URLs**: The `media_url` column already contains direct Threads CDN URLs (e.g., `scontent.cdninstagram.com`). These are hotlinked directly — no placeholder needed.
- **SEO approach**: Dynamic `document.title` + meta tag updates via `useEffect`. This is the best available approach for a Vite SPA without SSR.
- **Route structure**: `/story` = grid listing, `/story/:id` = individual post detail

