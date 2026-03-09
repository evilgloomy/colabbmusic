import { useState, useEffect } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { releases as staticReleases, getActiveCampaign, getReleasesByType, type Release } from "@/data/content";
import { fetchYouTubeFeed, fetchReleases, CHANNELS, type YouTubeVideo, type YouTubeRelease } from "@/lib/youtube";
import { Music, ExternalLink, Play, Loader2 } from "lucide-react";

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
      <a href={release.spotifyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
        <Music className="h-3.5 w-3.5" /> Spotify
      </a>
    )}
    {release.appleMusicUrl && (
      <a href={release.appleMusicUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
        <Music className="h-3.5 w-3.5" /> Apple Music
      </a>
    )}
    {release.youtubeUrl && (
      <a href={release.youtubeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
        <ExternalLink className="h-3.5 w-3.5" /> YouTube
      </a>
    )}
  </div>
);

const MusicPage = () => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [dbReleases, setDbReleases] = useState<YouTubeRelease[]>([]);
  const [ytVideos, setYtVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const campaign = getActiveCampaign();

  useEffect(() => {
    Promise.all([
      fetchReleases(),
      fetchYouTubeFeed(CHANNELS.ARTIST, 15),
    ]).then(([rel, vid]) => {
      setDbReleases(rel);
      setYtVideos(vid);
    }).finally(() => setLoading(false));
  }, []);

  const filteredReleases = activeTab === "all"
    ? staticReleases
    : getReleasesByType(activeTab as Release["releaseType"]);

  const hasDbReleases = dbReleases.length > 0;

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blush via-champagne to-warm-cream" />
        <div className="absolute inset-0">
          <img src={campaign.coverImage} alt="" className="w-full h-full object-cover opacity-15" />
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
      <section className="border-b border-border/60">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-xs tracking-widest uppercase text-muted-foreground">Stream on</span>
            <a href="https://www.youtube.com/@Cola_BB" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">YouTube Music</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Spotify</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Apple Music</a>
          </div>
        </div>
      </section>

      {/* Releases from DB */}
      <section className="container mx-auto px-6 py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-3">From YouTube</p>
            <h2 className="text-display-md font-display font-bold text-foreground">
              {hasDbReleases ? "Discography" : "Latest Releases"}
            </h2>
          </div>
          <a
            href="https://www.youtube.com/@Cola_BB/releases"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            View All →
          </a>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : hasDbReleases ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {dbReleases.map((release) => (
              <a
                key={release.id}
                href={release.playlist_id
                  ? `https://www.youtube.com/playlist?list=${release.playlist_id}`
                  : release.video_id
                    ? `https://www.youtube.com/watch?v=${release.video_id}`
                    : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="aspect-square overflow-hidden mb-4 relative rounded-sm bg-card">
                  {release.thumbnail_url ? (
                    <img
                      src={release.thumbnail_url}
                      alt={release.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Music className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
                </div>
                <h3 className="font-display text-sm font-medium text-foreground">{release.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {release.year}
                  {release.track_count && ` · ${release.track_count} tracks`}
                </p>
                {release.description && (
                  <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
                    {release.description}
                  </p>
                )}
              </a>
            ))}
          </div>
        ) : ytVideos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {ytVideos.map((video) => (
              <div key={video.videoId} className="group">
                <div className="aspect-square overflow-hidden mb-4 relative rounded-sm">
                  {playingId === video.videoId ? (
                    <iframe
                      src={`${video.embedUrl}?autoplay=1`}
                      className="w-full h-full"
                      allow="autoplay; encrypted-media"
                      allowFullScreen
                      title={video.title}
                    />
                  ) : (
                    <button
                      onClick={() => setPlayingId(video.videoId)}
                      className="w-full h-full relative cursor-pointer"
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/0 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center">
                          <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                        </div>
                      </div>
                    </button>
                  )}
                </div>
                <h3 className="font-display text-sm font-medium text-foreground">{video.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(video.published).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">No releases found.</p>
        )}
      </section>

      {/* Static Discography */}
      <section className="bg-blush/30">
        <div className="container mx-auto px-6 py-24">
          <h2 className="text-display-md font-display font-bold mb-12">Catalog</h2>

          <div className="flex flex-wrap gap-2 mb-12">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-4 py-2 text-xs font-medium tracking-wider uppercase rounded-sm transition-colors ${
                  activeTab === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredReleases.map((release) => (
              <div key={release.id} className="group">
                <div className="aspect-square overflow-hidden mb-4 relative rounded-sm">
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
