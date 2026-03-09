import { useState, useEffect } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { fetchYouTubeFeed, fetchReleases, CHANNELS, type YouTubeVideo, type YouTubeRelease } from "@/lib/youtube";
import { Music, ExternalLink, Play, Loader2 } from "lucide-react";

const MusicPage = () => {
  const [dbReleases, setDbReleases] = useState<YouTubeRelease[]>([]);
  const [ytVideos, setYtVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchReleases(),
      fetchYouTubeFeed(CHANNELS.ARTIST, 15),
    ]).then(([rel, vid]) => {
      setDbReleases(rel);
      setYtVideos(vid);
    }).finally(() => setLoading(false));
  }, []);

  const hasDbReleases = dbReleases.length > 0;

  // Separate albums/EPs (multi-track) from singles
  const albums = dbReleases.filter(r => (r.track_count ?? 0) > 1);
  const singles = dbReleases.filter(r => (r.track_count ?? 0) <= 1);

  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
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

      {/* Discography */}
      <section className="container mx-auto px-6 py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-3">Discography</p>
            <h2 className="text-display-md font-display font-bold text-foreground">
              {hasDbReleases ? "Albums & EPs" : "Latest Releases"}
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
          <>
            {/* Albums & EPs */}
            {albums.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-16">
                {albums.map((release) => (
                  <ReleaseCard key={release.id} release={release} />
                ))}
              </div>
            )}

            {/* Singles */}
            {singles.length > 0 && (
              <>
                <h3 className="text-display-sm font-display font-bold text-foreground mb-8">Singles</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {singles.map((release) => (
                    <ReleaseCard key={release.id} release={release} />
                  ))}
                </div>
              </>
            )}
          </>
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
    </PageLayout>
  );
};

const ReleaseCard = ({ release }: { release: YouTubeRelease }) => {
  const decodedThumb = release.thumbnail_url?.replace(/&amp;/g, '&');
  return (
    <a
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
        {decodedThumb ? (
          <img
            src={decodedThumb}
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
        {release.track_count && release.track_count > 1 && ` · ${release.track_count} tracks`}
      </p>
    </a>
  );
};

export default MusicPage;
