import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { releases, getActiveCampaign, getReleasesByType, type Release } from "@/data/content";
import { Music, ExternalLink } from "lucide-react";

const tabs = [
  { label: "All", value: "all" },
  { label: "Singles", value: "single" },
  { label: "EPs / Albums", value: "ep" },
  { label: "Covers", value: "cover" },
  { label: "Collaborations", value: "collaboration" },
] as const;

const StreamingLinks = ({ release }: { release: Release }) => (
  <div className="flex items-center gap-4">
    {release.spotifyUrl && (
      <a href={release.spotifyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
        <Music className="h-3.5 w-3.5" /> Spotify
      </a>
    )}
    {release.appleMusicUrl && (
      <a href={release.appleMusicUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
        <Music className="h-3.5 w-3.5" /> Apple Music
      </a>
    )}
    {release.youtubeUrl && (
      <a href={release.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
        <ExternalLink className="h-3.5 w-3.5" /> YouTube
      </a>
    )}
  </div>
);

const MusicPage = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const campaign = getActiveCampaign();

  const filteredReleases = activeTab === "all"
    ? releases
    : getReleasesByType(activeTab as Release["releaseType"]);

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={campaign.coverImage} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background" />
        </div>
        <div className="relative container mx-auto px-6 py-32 md:py-40">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-4">Listen Everywhere</p>
          <h1 className="text-display-lg font-display font-bold text-foreground mb-6">Music</h1>
          <p className="text-muted-foreground max-w-lg">
            Every song is a chapter. Every release is a world.
          </p>
        </div>
      </section>

      {/* Listen everywhere */}
      <section className="border-b border-border/40">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-xs tracking-widest uppercase text-muted-foreground">Stream on</span>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Spotify</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Apple Music</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">YouTube Music</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">SoundCloud</a>
          </div>
        </div>
      </section>

      {/* Latest release spotlight */}
      <section className="container mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="aspect-square overflow-hidden">
            <img src={campaign.coverImage} alt={campaign.title} className="w-full h-full object-cover" />
          </div>
          <div className="space-y-6">
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary">Latest Release</p>
            <h2 className="text-display-md font-display font-bold">{campaign.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{campaign.synopsis}</p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {campaign.genre && <span className="px-3 py-1 border border-border">{campaign.genre}</span>}
              {campaign.mood && <span className="px-3 py-1 border border-border">{campaign.mood}</span>}
              <span className="px-3 py-1 border border-border">{campaign.year}</span>
            </div>
            <StreamingLinks release={campaign} />
          </div>
        </div>
      </section>

      {/* Discography */}
      <section className="bg-card/30">
        <div className="container mx-auto px-6 py-24">
          <h2 className="text-display-md font-display font-bold mb-12">Discography</h2>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-12">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 text-xs font-medium tracking-wider uppercase transition-colors ${
                  activeTab === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredReleases.map((release) => (
              <div key={release.id} className="group">
                <div className="aspect-square overflow-hidden mb-4 relative bg-card">
                  <img
                    src={release.coverImage}
                    alt={release.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
                <h3 className="font-display text-sm font-medium text-foreground">{release.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  {release.year} · {release.releaseType === "ep" ? "EP" : release.releaseType.charAt(0).toUpperCase() + release.releaseType.slice(1)}
                </p>
                <StreamingLinks release={release} />
              </div>
            ))}
          </div>

          {filteredReleases.length === 0 && (
            <p className="text-muted-foreground text-center py-12">No releases in this category yet.</p>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default MusicPage;
