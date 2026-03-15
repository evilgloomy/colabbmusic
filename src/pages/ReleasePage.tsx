import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { PageLayout } from "@/components/layout/PageLayout";
import { supabase } from "@/integrations/supabase/client";
import { fetchStreamingLinks, PLATFORM_INFO, type StreamingLink } from "@/lib/streaming";
import { fetchReleaseTracks, type YouTubeRelease, type ReleaseTrack } from "@/lib/youtube";
import { ArrowLeft, Play, Pause, ExternalLink, Music } from "lucide-react";
import { useSEO, SITE_URL } from "@/hooks/useSEO";

const ReleasePage = () => {
  const { id } = useParams<{ id: string }>();
  const [release, setRelease] = useState<YouTubeRelease | null>(null);
  const [links, setLinks] = useState<StreamingLink[]>([]);
  const [tracks, setTracks] = useState<ReleaseTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from("releases").select("*").eq("id", id).single(),
      fetchStreamingLinks(id),
    ]).then(([{ data }, streamLinks]) => {
      if (data) setRelease(data as YouTubeRelease);
      setLinks(streamLinks);
      setLoading(false);
    });
  }, [id]);

  const jsonLd = useMemo(() => {
    if (!release) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": release.track_count && release.track_count > 1 ? "MusicAlbum" : "MusicRecording",
      name: release.title,
      byArtist: { "@type": "MusicGroup", name: "Cola B" },
      datePublished: release.release_date || release.year,
      image: release.thumbnail_url,
      url: `${SITE_URL}/release/${release.id}`,
    };
  }, [release]);

  useSEO({
    title: release ? `${release.title} — Cola B` : "Release — Cola B",
    description: release
      ? `Listen to ${release.title} by Cola B. ${release.year || ""}`
      : "Listen to Cola B on all platforms.",
    image: release?.thumbnail_url,
    jsonLd,
  });

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (!release) {
    return (
      <PageLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <h1 className="text-display-sm font-display font-bold text-foreground">Release not found</h1>
          <Link to="/music" className="text-primary hover:underline">← Back to Music</Link>
        </div>
      </PageLayout>
    );
  }

  const decodedThumb = release.thumbnail_url?.replace(/&amp;/g, "&");
  const videoId = release.video_id;

  return (
    <PageLayout>
      {/* Hero section with artwork */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, hsl(260 25% 14%) 0%, hsl(250 20% 8%) 60%, hsl(var(--background)) 100%)",
          }}
        />

        {/* Blurred background artwork */}
        {decodedThumb && (
          <div className="absolute inset-0">
            <img
              src={decodedThumb}
              alt=""
              className="w-full h-full object-cover opacity-15 blur-3xl scale-110"
            />
          </div>
        )}

        <div className="relative container mx-auto px-6 pt-32 pb-16 z-10">
          <Link
            to="/music"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white/90 transition-colors mb-10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Music
          </Link>

          <div className="flex flex-col md:flex-row gap-10 items-start">
            {/* Artwork */}
            <div className="w-full md:w-80 flex-shrink-0">
              {decodedThumb ? (
                <img
                  src={decodedThumb}
                  alt={release.title}
                  className="w-full aspect-square object-cover rounded-xl shadow-2xl"
                />
              ) : (
                <div className="w-full aspect-square rounded-xl bg-white/10 flex items-center justify-center">
                  <Music className="h-16 w-16 text-white/30" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-white/50 mb-3">
                {release.track_count && release.track_count > 1 ? "Album" : "Single"}
              </p>
              <h1 className="text-display-lg font-display font-bold text-white mb-3">
                {release.title}
              </h1>
              <p className="text-xl text-white/70 mb-2">Cola B</p>
              <p className="text-sm text-white/40">
                {release.year}
                {release.track_count && release.track_count > 1 ? ` · ${release.track_count} tracks` : ""}
              </p>

              {release.description && (() => {
                const lines = release.description.split('\n').filter(l => l.trim());
                const firstLine = lines[0] || '';
                const isLyrics = firstLine.length > 300 || release.description.includes('Composer:') || release.description.includes('【Lyrics】');
                if (isLyrics) {
                  const introEnd = release.description.search(/(?:Composer:|【Lyrics|🎵\s*Lyrics|\[Lyrics)/i);
                  if (introEnd > 20) {
                    const intro = release.description.slice(0, introEnd).trim();
                    if (intro.length < 500) {
                      return <p className="text-white/60 mt-6 max-w-lg leading-relaxed">{intro}</p>;
                    }
                  }
                  return null;
                }
                const shortDesc = firstLine.length > 200 ? firstLine.slice(0, 200) + '…' : firstLine;
                return <p className="text-white/60 mt-6 max-w-lg leading-relaxed">{shortDesc}</p>;
              })()}

              {/* Play button */}
              {videoId && !isPlaying && (
                <button
                  onClick={() => setIsPlaying(true)}
                  className="mt-8 inline-flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-sm tracking-wider uppercase transition-all hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--champagne)) 0%, hsl(var(--primary)) 100%)",
                    color: "hsl(260 25% 14%)",
                  }}
                >
                  <Play className="h-5 w-5" />
                  Play Now
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* YouTube Player */}
      {videoId && isPlaying && (
        <section className="bg-black">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={release.title}
              />
            </div>
          </div>
        </section>
      )}

      {/* Streaming Links */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-display-sm font-display font-bold text-foreground mb-8">
          Listen Everywhere
        </h2>

        {links.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {links.map((link) => {
              const info = PLATFORM_INFO[link.platform];
              const label = info?.label || link.platform.replace(/_/g, " ");
              const color = info?.color || "#888";

              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-5 rounded-xl border border-border/60 hover:border-border transition-all hover:shadow-lg bg-card"
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    {info?.icon ? (
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill={color}>
                        <path d={info.icon} />
                      </svg>
                    ) : (
                      <Music className="h-6 w-6" style={{ color }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground capitalize">{label}</p>
                    <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                </a>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground mb-6">
              Streaming links coming soon. In the meantime:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Apple Music", url: "https://music.apple.com/artist/cola-b/1663793217", color: "#FA233B" },
                { label: "Spotify", url: "https://open.spotify.com/artist/00rDJJmfKiMqxsGOuJmlzz", color: "#1DB954" },
                { label: "YouTube Music", url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : "https://www.youtube.com/@Cola_BB", color: "#FF0000" },
              ].map((p) => (
                <a
                  key={p.label}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-4 p-5 rounded-xl border border-border/60 hover:border-border transition-all hover:shadow-lg bg-card"
                >
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${p.color}20` }}
                  >
                    <Music className="h-6 w-6" style={{ color: p.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{p.label}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}
      </section>
    </PageLayout>
  );
};

export default ReleasePage;
