import { PageLayout } from "@/components/layout/PageLayout";
import { CampaignHero } from "@/components/home/v2/CampaignHero";
import { StatementLine } from "@/components/home/v2/StatementLine";
import { PersonalIntro } from "@/components/home/v2/PersonalIntro";
import { MusicUniverse } from "@/components/home/v2/MusicUniverse";
import { WhyIMakeMusic } from "@/components/home/v2/WhyIMakeMusic";
import { WorldSection } from "@/components/home/v2/WorldSection";
import { ProofOfScale } from "@/components/home/v2/ProofOfScale";
import { VideoFilm } from "@/components/home/v2/VideoFilm";
import { StoreBand } from "@/components/home/v2/StoreBand";
import { TalkToCola } from "@/components/home/v2/TalkToCola";
import { ClosingStatement } from "@/components/home/v2/ClosingStatement";
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
      "Enter Cola's World — music, films, journal and atelier from Cola B, the Queen of Emo Pop.",
    exactTitle: true,
    jsonLd,
  });

  return (
    <PageLayout transparentNav>
      <h1 className="sr-only">Cola B — Queen of Emo Pop. Official music, videos, world, and store.</h1>
      <CampaignHero />
      <StatementLine />
      <PersonalIntro />
      <MusicUniverse />
      <WhyIMakeMusic />
      <WorldSection />
      <ProofOfScale />
      <VideoFilm />
      <StoreBand />
      <TalkToCola />
      <ClosingStatement />
    </PageLayout>
  );
};

export default Index;
