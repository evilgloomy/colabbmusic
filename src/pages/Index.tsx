import { PageLayout } from "@/components/layout/PageLayout";
import { HeroSection } from "@/components/home/HeroSection";
import { CurrentEra } from "@/components/home/CurrentEra";
import { FeaturedMusic } from "@/components/home/FeaturedMusic";
import { StoryPreview } from "@/components/home/StoryPreview";
import { FeaturedVideo } from "@/components/home/FeaturedVideo";
import { StorePreview } from "@/components/home/StorePreview";
import { PressPreview } from "@/components/home/PressPreview";

const Index = () => {
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
