import { PageLayout } from "@/components/layout/PageLayout";
import { HeroSection } from "@/components/home/HeroSection";
import { SpotifyFollow } from "@/components/home/SpotifyFollow";
import { CurrentEra } from "@/components/home/CurrentEra";
import { FeaturedMusic } from "@/components/home/FeaturedMusic";
import { StoryPreview } from "@/components/home/StoryPreview";
import { FeaturedVideo } from "@/components/home/FeaturedVideo";
import { StorePreview } from "@/components/home/StorePreview";
import { PressPreview } from "@/components/home/PressPreview";
import { useSEO, SITE_URL } from "@/hooks/useSEO";
import { useMemo } from "react";

const SAME_AS = [
  "https://open.spotify.com/artist/3LrZ1mrMzMFm5forQrdBVn",
  "https://music.apple.com/artist/cola-b/1663793217",
  "https://www.youtube.com/@Cola_BB",
  "https://www.instagram.com/cola_bb_official",
  "https://www.facebook.com/cokebb225",
  "https://www.tiktok.com/@cola_bb_official",
  "https://www.threads.net/@cola_bb_official",
];

const Index = () => {
  const jsonLd = useMemo(
    () => [
      {
        "@context": "https://schema.org",
        "@type": "MusicGroup",
        name: "Cola B",
        alternateName: "Queen of Emo Pop",
        url: SITE_URL,
        image: `${SITE_URL}/og-image.jpg`,
        genre: ["Emo Pop", "Pop", "R&B", "Alternative"],
        sameAs: SAME_AS,
      },
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Cola B",
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/music?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
    [],
  );

  useSEO({
    title: "Cola B — Queen of Emo Pop | Official Site",
    description:
      "Official headquarters of Cola B — music, story, videos, and curated lifestyle from the Queen of Emo Pop.",
    exactTitle: true,
    jsonLd,
  });

  return (
    <PageLayout>
      <HeroSection />
      <SpotifyFollow />
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
