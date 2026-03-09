import { PageLayout } from "@/components/layout/PageLayout";
import { HeroSection } from "@/components/home/HeroSection";
import { CurrentEra } from "@/components/home/CurrentEra";
import { StoryPreview } from "@/components/home/StoryPreview";

const Index = () => {
  return (
    <PageLayout>
      <HeroSection />
      <CurrentEra />
      <StoryPreview />
    </PageLayout>
  );
};

export default Index;