## Goal
Update every Spotify artist link/ID for Cola B to the new artist: `3LrZ1mrMzMFm5forQrdBVn`
(https://open.spotify.com/artist/3LrZ1mrMzMFm5forQrdBVn)

Album/track embed IDs on LoveVibeVol5 are NOT artist links and will be left alone.

## Files to update

1. **src/data/content.ts** — `socialLinks.spotify` → new artist URL
2. **src/components/home/SpotifyFollow.tsx** — `SPOTIFY_ARTIST_ID` constant → `3LrZ1mrMzMFm5forQrdBVn`
3. **src/pages/Index.tsx** (line 14) — hardcoded artist URL → new URL
4. **src/pages/ReleasePage.tsx** (line 230) — fallback Spotify artist URL → new URL
5. **src/pages/Music.tsx** (line 71) — replace the existing different ID `4nDss1M3MqgFwRSBCmuyST` with the new artist URL
6. **src/components/home/CurrentEra.tsx** (line 48) — fallback artist URL → new URL

No backend / DB changes. No edge function changes (scrape-hyperfollow only references `spotify.com` as a domain allowlist).
