

# Plan: Sort by Release Date (Descending) + "Show More" Pagination

## Changes

### 1. `src/lib/youtube.ts` — Add paginated fetch
- Add `fetchReleasesPaginated(offset, limit)` that uses `.range(offset, offset + limit - 1)` with `.order("sort_date", { ascending: false, nullsFirst: false })` and a secondary `.order("year", { ascending: false })` fallback.
- Returns `{ releases, hasMore }` (hasMore = true if returned count equals limit).

### 2. `src/pages/Music.tsx` — Show 30 at a time with "Show More"
- Replace `fetchReleases()` with paginated fetch, initial load = 30 items.
- Add `visibleCount` state, increment by 30 on "Show More" click.
- Split visible albums vs singles from the loaded data.
- Add a "Show More" button at the bottom that loads the next batch and appends to state.
- Both Albums/EPs and Singles sections draw from the same sorted list, just filtered by `track_count`.

