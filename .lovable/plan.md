

## Fix Video Preview on Story Grid Cards

### Problem
The `StoryCard` component in `Story.tsx` renders all media as `<img>` tags (line 120-126). When the story has `media_type: "VIDEO"`, the `media_url` points to an `.mp4` or streaming video URL, which `<img>` cannot display -- resulting in a broken/blank card.

### Solution
In the `StoryCard` component, check `story.media_type`. If it's `"VIDEO"`, render a `<video>` element instead of `<img>` with the proper attributes for a silent auto-preview:

- `muted` -- required for autoplay on mobile
- `playsInline` -- required for inline playback on iOS
- `autoPlay` -- auto-start the preview loop
- `loop` -- keep it looping as a visual preview
- `preload="auto"` -- load video data for quick display
- No `controls` -- the card is a link, not a player

Also add a small play icon overlay on video cards so users know it's a video.

### Files to change

1. **`src/pages/Story.tsx`** -- Update `StoryCard` to conditionally render `<video>` for VIDEO media type instead of `<img>`, with muted autoplay loop for preview. Add a play icon badge.

2. **`src/components/home/StoryPreview.tsx`** -- Apply the same video handling if story preview cards also render media (need to check this file, but likely same pattern).

