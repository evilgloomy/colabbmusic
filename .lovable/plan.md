

## Fix SoundCloud embed player URLs

The embedded player isn't loading tracks because the URLs use SoundCloud's **share-link format** (`/s-XXX` as a path segment) which the `w.soundcloud.com/player` widget cannot resolve. The widget needs the **canonical track URL** with the secret token as a query parameter.

### The fix

In `src/pages/LoveVibeVol5.tsx`, rewrite each track URL from:

```
https://soundcloud.com/coke-wang-703401983/cola-b-yi-du-bu-hui-1/s-kHSruox3LPE
```

to:

```
https://soundcloud.com/coke-wang-703401983/cola-b-yi-du-bu-hui-1?secret_token=s-kHSruox3LPE
```

The `embedUrl()` helper already calls `encodeURIComponent(url)` so the `?secret_token=…` will be safely encoded into the player iframe `src`.

### All 10 tracks updated

| # | Track | New URL |
|---|---|---|
| 01 | 已讀不回 | `…/cola-b-yi-du-bu-hui-1?secret_token=s-kHSruox3LPE` |
| 02 | 越來越冷淡 | `…/cola-b-yue-lai-yue-leng-dan-shivering-version-2?secret_token=s-GpZsebHg0IX` |
| 03 | 重重疊疊 | `…/colabzhong-zhong-die-die-3?secret_token=s-q2CVk9ozLSk` |
| 04 | Slowburn | `…/cola-b-slowburn-4?secret_token=s-YIaVQG2BNQL` |
| 05 | Agony 愛過你 | `…/cola-b-agony-ai-guo-ni-5?secret_token=s-qEcHlTGA9xT` |
| 06 | Despair | `…/cola-b-despair-6?secret_token=s-WeErIu0n03x` |
| 07 | Pain | `…/cola-b-pain-7?secret_token=s-lylwqaT5cJo` |
| 08 | 惡作劇 | `…/cola-b-e-zuo-ju-8?secret_token=s-0g07qnUDUtf` |
| 09 | Decision | `…/cola-b-decision-9?secret_token=s-xWfbJ4MSoMh` |
| 10 | Restraint | `…/cola-b-restraint-10?secret_token=s-FWhyjfKtmLF` |

### Files to edit

- `src/pages/LoveVibeVol5.tsx` — replace the `tracks` array URL field for all 10 entries.

### Why the current URLs fail

SoundCloud's `/s-XXXX` path-style links are short share links meant for browsers — they hit a redirect handler that resolves the actual track. The embed widget API at `w.soundcloud.com/player` does **not** follow that redirect; it calls SoundCloud's resolve endpoint directly, which only accepts canonical track URLs plus `secret_token` as a query string. Switching to query-param form makes the widget resolve and render the player correctly.

