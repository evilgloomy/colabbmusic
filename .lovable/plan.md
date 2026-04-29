## Restore standard homepage at `/`

The `src/pages/Index.tsx` file got overwritten with the LoveVibe Vol. 5 content, so the main site front page is gone. The dedicated `/lovevibevol5` route still exists and is unaffected. We'll restore Index.tsx to render the standard editorial homepage using the existing `home/` components.

### File to edit

**`src/pages/Index.tsx`** — replace the LoveVibe content with the standard homepage layout:

```tsx
import { PageLayout } from "@/components/layout/PageLayout";
import { HeroSection } from "@/components/home/HeroSection";
import { CurrentEra } from "@/components/home/CurrentEra";
import { FeaturedMusic } from "@/components/home/FeaturedMusic";
import { StoryPreview } from "@/components/home/StoryPreview";
import { FeaturedVideo } from "@/components/home/FeaturedVideo";
import { StorePreview } from "@/components/home/StorePreview";
import { PressPreview } from "@/components/home/PressPreview";
import { useSEO } from "@/hooks/useSEO";

const Index = () => {
  useSEO({ title: "Cola B — Queen of Emo Pop", description: "..." });
  return (
    <PageLayout>
      <HeroSection />
      <CurrentEra />
      <FeaturedMusic />
      <StoryPreview />
      <FeaturedVideo />
      <StorePreview />
      <PressPreview />
    </PageLayout>
  );
};

export default Index;
```

### Notes

- `/lovevibevol5` route is untouched — the A&R preview page remains accessible
- All `home/` components already exist; we're just re-wiring them
- I'll verify the exact section order and SEO copy from existing patterns before writing
