

## HK Traditional Chinese & English Translation System

### Approach
Use `react-i18next` for a client-side internationalization system with Hong Kong Traditional Chinese (zh-HK) and English (en) as the two languages. A language toggle in the navbar persists the choice to `localStorage`.

### Content Categories

There are two types of content to translate:

1. **Static UI strings** — nav labels, section headers, button text, page descriptions, filter labels, footer text, brand bios. These are defined in JSON translation files and swapped via `t()` calls.

2. **Dynamic database content** — release titles, story titles/text, descriptions. These come from YouTube/Threads in their original language and are already multilingual by nature (e.g. 龍捲風 is already Chinese). No auto-translation needed for these; they display as-is.

### Implementation

**1. Install & configure `react-i18next`**
- Add `i18next`, `react-i18next`, `i18next-browser-languagedetector` packages
- Create `src/i18n/index.ts` — init i18n with `lng: 'en'`, fallback `'en'`, resources from JSON files, and browser language detection with localStorage persistence

**2. Create translation files**
- `src/i18n/en.json` — all English UI strings organized by namespace (nav, home, music, story, videos, store, press, chat, footer, common)
- `src/i18n/zh-HK.json` — Hong Kong Traditional Chinese translations for every key

Example structure:
```json
{
  "nav": { "home": "主頁", "music": "音樂", "story": "故事", "videos": "影片", "store": "商店", "press": "媒體", "chat": "聊天" },
  "home": { "listenNow": "立即收聽", "watchVideo": "觀看影片", "digitalSingerSongwriter": "數碼創作歌手", "latestReleases": "最新發佈", "insideColasWorld": "Cola的世界", "fromHerWorld": "她的世界", "viewAll": "查看全部", "latestMusicVideo": "最新音樂影片", "visitTheStore": "瀏覽商店" },
  "music": { "listenEverywhere": "隨處收聽", "discography": "作品集", "albumsAndEPs": "專輯及EP", "singles": "單曲", "showMore": "顯示更多" },
  ...
}
```

**3. Add language toggle to Navbar**
- A small `EN / 繁` toggle button in the navbar (desktop right side, mobile menu bottom)
- Calls `i18n.changeLanguage()` on click
- Persisted via `i18next-browser-languagedetector` localStorage backend

**4. Update all page/component files to use `useTranslation()`**
Files to update (replacing hardcoded strings with `t()` calls):
- `src/components/layout/Navbar.tsx` — nav labels
- `src/components/layout/Footer.tsx` — footer links and text
- `src/components/home/HeroSection.tsx` — hero text, CTAs
- `src/components/home/CurrentEra.tsx` — section labels
- `src/components/home/StoryPreview.tsx` — section headers
- `src/components/home/PressPreview.tsx` — about section
- `src/pages/Music.tsx` — page hero, section headers, filter labels
- `src/pages/Story.tsx` — hero, category filters, empty states
- `src/pages/StoryDetail.tsx` — back link, labels
- `src/pages/Videos.tsx` — hero, labels
- `src/pages/Store.tsx` — hero text
- `src/pages/Press.tsx` — all section headers, bio labels, CTA buttons
- `src/pages/ReleasePage.tsx` — labels (Album/Single, Play Now, Tracklist, Listen Everywhere)
- `src/pages/ChatPage.tsx` — loading text, auth prompts
- `src/pages/Policies.tsx` — if applicable
- `src/data/content.ts` — brand bios (provide both languages, select based on current locale)

**5. Brand content bilingual handling**
- In `content.ts`, restructure `brand` to have `en` and `zh-HK` variants for `shortBio`, `mediumBio`, `longBio`, `tagline`, `studioStatement`
- Create a `useBrand()` hook or helper that returns the correct language variant based on current i18n language

**6. Date formatting**
- Update all `toLocaleDateString("en-US", ...)` calls to use the current locale (`en-US` or `zh-HK`) dynamically

**7. Future-proofing**
- All new UI strings go through `t()` — the pattern is established
- Dynamic content (releases, stories) auto-updates from syncs in their original language, no translation layer needed

### What stays the same
- Dynamic content from database (release titles, story text) displays as-is
- No backend changes needed — this is purely a frontend i18n layer
- SEO meta tags will use the current language for titles/descriptions

