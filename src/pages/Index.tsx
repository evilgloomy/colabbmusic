import { useMemo } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { HeroSection } from "@/components/home/HeroSection";
import { CurrentEra } from "@/components/home/CurrentEra";
import { FeaturedMusic } from "@/components/home/FeaturedMusic";
import { StoryPreview } from "@/components/home/StoryPreview";
import { FeaturedVideo } from "@/components/home/FeaturedVideo";
import { StorePreview } from "@/components/home/StorePreview";
import { PressPreview } from "@/components/home/PressPreview";
import { useSEO, SITE_URL } from "@/hooks/useSEO";

const Index = () => {
  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: "Cola B",
    url: SITE_URL,
    genre: ["Mandopop", "Emo Pop", "R&B"],
    sameAs: [
      "https://open.spotify.com/artist/4nDss1M3MqgFwRSBCmuyST",
      "https://music.apple.com/ca/artist/cola-b/1687906975",
      "https://www.youtube.com/@Cola_BB",
    ],
  }), []);

  useSEO({
    title: "Cola B — Official Site | Queen of Emo Pop",
    description: "The official home of Cola B — Mandarin pop singer-songwriter. Latest music, videos, story, and merchandise.",
    jsonLd,
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
