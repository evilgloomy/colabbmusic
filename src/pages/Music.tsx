import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { fetchYouTubeFeed, fetchReleasesPaginated, CHANNELS, type YouTubeVideo, type YouTubeRelease } from "@/lib/youtube";
import { Music, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from "react-i18next";
import bannerMusic from "@/assets/banner-music.jpg";

const PAGE_SIZE = 30;

const MusicPage = () => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("zh") ? "zh-HK" : "en-US";

  useSEO({
    title: t("music.pageTitle") + " — Cola B",
    description: t("music.pageDesc"),
  });

  const [dbReleases, setDbReleases] = useState<YouTubeRelease[]>([]);
  const [ytVideos, setYtVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetchReleasesPaginated(0, PAGE_SIZE),
      fetchYouTubeFeed(CHANNELS.ARTIST, 15),
    ]).then(([{ releases, hasMore: more }, vid]) => {
      setDbReleases(releases);
      setHasMore(more);
      setYtVideos(vid);
    }).finally(() => setLoading(false));
  }, []);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    const { releases, hasMore: more } = await fetchReleasesPaginated(dbReleases.length, PAGE_SIZE);
    setDbReleases(prev => [...prev, ...releases]);
    setHasMore(more);
    setLoadingMore(false);
  }, [dbReleases.length]);

  const hasDbReleases = dbReleases.length > 0;
  const albums = dbReleases.filter(r => (r.track_count ?? 0) > 1);
  const singles = dbReleases.filter(r => (r.track_count ?? 0) <= 1);

  return (
    <PageLayout>
      <section className="relative overflow-hidden">
        <img src={bannerMusic} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/40" />
        <div className="relative container mx-auto px-6 py-32 md:py-40">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-4">{t("music.listenEverywhere")}</p>
          <h1 className="text-display-lg font-display font-bold text-foreground mb-6">{t("music.pageTitle")}</h1>
          <p className="text-muted-foreground max-w-lg">{t("music.pageDesc")}</p>
        </div>
      </section>

      <section className="border-b border-border/60">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-xs tracking-widest uppercase text-muted-foreground">{t("music.streamOn")}</span>
            <a href="https://www.youtube.com/@Cola_BB" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">YouTube Music</a>
            <a href="https://open.spotify.com/artist/4nDss1M3MqgFwRSBCmuyST" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">Spotify</a>
            <a href="https://music.apple.com/ca/artist/cola-b/1687906975" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors">Apple Music</a>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-24">
        <div className="mb-12">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-3">{t("music.discography")}</p>
          <h2 className="text-display-md font-display font-bold text-foreground">
            {hasDbReleases ? t("music.albumsAndEPs") : t("music.latestReleases")}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : hasDbReleases ? (
          <>
            {albums.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-16">
                {albums.map((release) => <ReleaseCard key={release.id} release={release} />)}
              </div>
            )}
            {singles.length > 0 && (
              <>
                <h3 className="text-display-sm font-display font-bold text-foreground mb-8">{t("music.singles")}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                  {singles.map((release) => <ReleaseCard key={release.id} release={release} />)}
                </div>
              </>
            )}
            {hasMore && (
              <div className="flex justify-center mt-16">
                <Button variant="outline" size="lg" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("music.loading")}</> : t("music.showMore")}
                </Button>
              </div>
            )}
          </>
        ) : ytVideos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {ytVideos.map((video) => (
              <div key={video.videoId} className="group">
                <div className="aspect-square overflow-hidden mb-4 relative rounded-sm">
                  {playingId === video.videoId ? (
                    <iframe src={`${video.embedUrl}?autoplay=1`} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={video.title} />
                  ) : (
                    <button onClick={() => setPlayingId(video.videoId)} className="w-full h-full relative cursor-pointer">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                      <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/0 transition-colors" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center"><Play className="h-5 w-5 text-primary-foreground ml-0.5" /></div>
                      </div>
                    </button>
                  )}
                </div>
                <h3 className="font-display text-sm font-medium text-foreground">{video.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(video.published).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">{t("music.noReleases")}</p>
        )}
      </section>
    </PageLayout>
  );
};

const ReleaseCard = ({ release }: { release: YouTubeRelease }) => {
  const { t } = useTranslation();
  const thumbSrc = release.thumbnail_url || (release.video_id ? `https://img.youtube.com/vi/${release.video_id}/mqdefault.jpg` : null);

  return (
    <Link to={`/release/${release.id}`} className="group block">
      <div className="aspect-square overflow-hidden mb-4 relative rounded-sm bg-card">
        {thumbSrc ? (
          <img src={thumbSrc} alt={release.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Music className="h-8 w-8" /></div>
        )}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
      </div>
      <h3 className="font-display text-sm font-medium text-foreground">{release.title}</h3>
      <p className="text-xs text-muted-foreground mt-1">
        {release.year}
        {release.track_count && release.track_count > 1 && ` · ${release.track_count} ${t("home.tracks")}`}
      </p>
    </Link>
  );
};

export default MusicPage;
