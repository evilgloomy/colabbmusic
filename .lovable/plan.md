

# Plan: Fetch Full Discography via InnerTube Pagination

## Problem
The scraper only gets ~30 releases because it reads the initial HTML page load. YouTube's `/releases` tab uses **infinite scroll with continuation tokens** to load more content. The full catalog has 100+ releases but only the first page is captured.

## Solution
Use YouTube's private **InnerTube `browse` API** to paginate through all releases. The initial `ytInitialData` contains both the first batch of releases AND a continuation token. We POST that token to `https://www.youtube.com/youtubei/v1/browse` to get the next page, which contains another token, and so on until all releases are fetched.

```text
Initial HTML (/releases)
  → Parse ytInitialData → 30 releases + continuationToken
     → POST /youtubei/v1/browse {continuation: token1} → next 30 + token2
        → POST /youtubei/v1/browse {continuation: token2} → next 30 + token3
           → ... until no more tokens
```

## Changes

### 1. Update `sync-releases` edge function

Rewrite `fetchReleasesPage()` to:
- Parse the first batch of releases AND the continuation token from `ytInitialData`
- Loop: POST to `https://www.youtube.com/youtubei/v1/browse` with the continuation token and an InnerTube client context payload (`{ context: { client: { clientName: "WEB", clientVersion: "2.20240101.00.00" } }, continuation: "..." }`)
- Parse each response for more releases and the next continuation token
- Stop when no continuation token is returned
- Add a delay between requests to avoid rate limiting

### 2. Fix continuation token extraction

The continuation token lives at a path like:
`richGridRenderer.contents[last].continuationItemRenderer.continuationEndpoint.continuationCommand.token`

Each browse response returns the same structure under `onResponseReceivedActions[0].appendContinuationItemsAction.continuationItems`.

### 3. Keep enrichment batched

With 100+ releases, enriching each one (fetching individual playlist pages) will be slow. Increase batch size to 5 concurrent and keep 500ms delays. The edge function has a 150s timeout which should be sufficient.

### 4. No frontend changes needed

The Music page already reads all releases from the DB and displays them in Albums/EPs vs Singles sections. More releases in the DB means more shown automatically.

