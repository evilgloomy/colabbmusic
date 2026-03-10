

## Plan: Promote clicked video to main viewer

**Current behavior**: Clicking a thumbnail in the grid plays the video inline via an embedded iframe.

**Desired behavior**: Clicking a grid thumbnail moves that video to the featured (hero) section at the top and starts playing it there.

### Changes — `src/pages/Videos.tsx`

1. Add a `featuredIndex` state (default `0`) to track which video is in the hero slot.
2. When a grid thumbnail is clicked, set `featuredIndex` to that video's index, set `playingId` to its `videoId`, and scroll to the top of the page.
3. The grid shows all videos *except* the currently featured one.
4. Remove inline iframe playback from grid items — they act as selectors only.

Single file change, ~20 lines modified.

