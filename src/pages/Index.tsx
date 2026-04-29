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
  useSEO({
    title: "Cola B — Queen of Emo Pop",
    description:
      "Official headquarters of Cola B — music, story, videos, and curated lifestyle from the Queen of Emo Pop.",
  });

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
