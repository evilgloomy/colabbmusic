# Cola B — Visual Repair Pass + Phase 3

No redesign. All routes, data fetchers, Shopify, chat, i18n, analytics and AIPF stay untouched. This is a framing, typography, spacing and copy-accuracy repair on top of the current build, then the remaining inner pages.

## 1. New assets

The 4 newly uploaded portraits become optimized JPEGs alongside the existing 7 in `src/assets/campaign/`:

- midnight city wide → new desktop hero
- plum noir vertical → new mobile hero
- burgundy lounge editorial + moody burgundy editorial → introduction and store bands

Existing assets stay available; nothing is deleted until its replacement is in place. No new person, no stock model, no face edits.

## 2. EditorialImage component

One shared `src/components/editorial/EditorialImage.tsx` handling: desktop source, mobile source, per-breakpoint `object-position`, per-breakpoint aspect ratio, alt, priority loading, optional overlay. Each asset gets its own focal values — no global `center` default. Rolled out to hero, introduction, store, world and closing bands.

## 3. Hero rebuild

Single responsive flex layout — no absolutely positioned title fragments. Height `clamp(760px, 92vh, 980px)` desktop; `min(900px, 100svh)` with a 720px floor on mobile. Text column max 650px, `clamp(24px, 5vw, 88px)` padding, vertically centred, 100px clear of the header, 48px clear of the bottom. Restrained gradient scrim, never across her face.

Copy structure changes: eyebrow `COLA B · 官方網站` / `COLA B · OFFICIAL`, headline `COLA B` (nowrap), Chinese subheadline `一個由音樂開始嘅世界`, supporting line `AI Singer-Songwriter · 虛擬偶像 · 音樂人`, buttons `聽最新作品` / `進入 Cola 嘅世界`. The world CTA stops being the giant headline.

Focal points: desktop `72% center`, mobile `62% center`, tuned after visual inspection.

## 4. Introduction section

Portrait-fitting asset in a 4:5 frame capped at 720px tall, 44/56 two-column grid at 1320px, 64–96px gap, explicit focal point (~`65% center`). Mobile stacks image then copy with 32–48px separation, no negative margins.

Copy replaced with the accurate bio: born in Vancouver, Hong Kong family background, Cantonese/English/Mandarin, AI singer-songwriter, virtual idol and music artist, career from 2023, range from POPVIBE and Mandopop to R&B, dark love songs, dance and lo-fi. Both EN and 繁 versions, as i18n keys. The "emo pop from Hong Kong" line is removed.

## 5. Store band

Correctly framed 4:5 image at ~42% width, focal point set explicitly, face and upper silhouette fully inside the frame. Copy becomes "Wear a piece of Cola's world" / 「將 Cola 世界入面嘅一部分帶走」 with the official-store CTA. "A small, considered collection" is removed.

## 6. Typography and rhythm

Chinese headline rules go into the token layer: `word-break: keep-all`, `overflow-wrap: normal`, sensible `max-width` in `em`, `clamp()` on every large size. Hero, section title and Chinese subtitle each get a defined scale. Body: 65ch English, ~30 full-width characters Chinese, 1.7–1.9 line-height CJK, 1.6–1.75 Latin.

Shared container: 1320px, `padding-inline: clamp(20px, 5vw, 72px)`. Section rhythm 110–160px desktop, 80–110px tablet, 64–88px mobile. Fixed heights removed from content sections.

## 7. Bio accuracy sweep

Every page checked against the confirmed facts (Coke Wang, born 25 Feb 2001 in Vancouver, Shiba Inu Media / Shiba Inu Records, VEVO artist, 50+ songs, representative works 一個傻子 / 朋友圈 / 00:43 / 失望值滿 / 越來越冷淡). Nothing invented; no "born in Hong Kong", no "emo pop only" framing.

## 8. Phase 3 — inner pages

Same editorial language applied to About (`/about-cola`), Press, Music, Release detail, World (`/story`), Videos, Store/Product, Chat and 404. Presentation only — Shopify, chat auth and gating, and all data fetching stay as they are. Incomplete records are hidden rather than rendered as placeholders.

## 9. QA and screenshots

Playwright pass at 1920 / 1536 / 1440 / 1366 / 1280 / 1024 / 834 / 768 / 430 / 390 / 375, in both languages. Checks: face never cropped, no text across her face, no vertical Chinese breaking, no horizontal overflow, no clipped buttons, no empty fixed-height gaps, no image distortion.

Delivered screenshots: Chinese and English desktop hero, Chinese and English mobile hero, introduction desktop and mobile, store desktop and mobile — plus a report of the file, object-position and aspect ratio used per section, and the copy and responsive fixes made. Nothing is published before that review.

## Technical notes

No schema changes, no new tables, no route changes. New copy lands as i18n keys in `en.json` and `zh-HK.json`, never hardcoded. Design tokens change in `index.css` / `tailwind.config.ts` only; components keep using semantic tokens.
