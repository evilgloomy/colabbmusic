import { useMemo } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { HeroSection } from "@/components/home/HeroSection";
import { CurrentEra } from "@/components/home/CurrentEra";
import { StoryPreview } from "@/components/home/StoryPreview";
import { useSEO, SITE_URL } from "@/hooks/useSEO";

const Index = () => {
  const jsonLd = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: "Cola B",
    url: SITE_URL,
    genre: ["Hip Hop", "R&B", "Pop"],
    sameAs: [
      "https://open.spotify.com/artist/4nDss1M3MqgFwRSBCmuyST",
      "https://music.apple.com/ca/artist/cola-b/1687906975",
      "https://www.youtube.com/@Cola_BB",
    ],
  }), []);

  useSEO({
    title: "Cola B — Official Site | Music, Videos & Merch",
    description: "The official home of Cola B — latest music, videos, story, and exclusive merchandise.",
    jsonLd,
  });

  return (
    <PageLayout>
      <HeroSection />
      <CurrentEra />
      <StoryPreview />
    </PageLayout>
  );
};

export default Index;
