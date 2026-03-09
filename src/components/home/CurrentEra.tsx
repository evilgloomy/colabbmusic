import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchReleases, type YouTubeRelease } from "@/lib/youtube";
import { Music, ExternalLink } from "lucide-react";

export const CurrentEra = () => {
  const [latest, setLatest] = useState<YouTubeRelease | null>(null);

  useEffect(() => {
    fetchReleases().then((releases) => {
      if (releases.length > 0) setLatest(releases[0]);
    });
  }, []);

  if (!latest) return null;

  const decodedThumb = latest.thumbnail_url?.replace(/&amp;/g, '&');
  const youtubeUrl = latest.playlist_id
    ? `https://www.youtube.com/playlist?list=${latest.playlist_id}`
    : latest.video_id
      ? `https://www.youtube.com/watch?v=${latest.video_id}`
      : '#';

  return (
    <section className="container mx-auto px-6 py-24 md:py-32">
      <div className="glass rounded-lg overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Cover art */}
          <div className="aspect-square md:aspect-auto overflow-hidden">
            {decodedThumb ? (
              <img
                src={decodedThumb}
                alt={latest.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-card text-muted-foreground">
                <Music className="h-12 w-12" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-8 md:p-12 flex flex-col justify-center space-y-6">
            <div>
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-1">
                Latest Release
              </p>
              <div className="w-12 h-px bg-primary/40 mt-3" />
            </div>
            <h2 className="text-display-md font-display font-bold text-foreground">
              {latest.title}
            </h2>
            {latest.description && (
              <p className="text-muted-foreground leading-relaxed text-sm line-clamp-3">
                {latest.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {latest.year && (
                <span className="px-3 py-1 border border-border rounded-sm">{latest.year}</span>
              )}
              {latest.track_count && latest.track_count > 1 && (
                <span className="px-3 py-1 border border-border rounded-sm">{latest.track_count} tracks</span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ExternalLink className="h-4 w-4" /> YouTube
              </a>
            </div>

            <Link
              to="/music"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground text-xs font-medium tracking-wider uppercase rounded-sm hover:bg-primary/90 transition-colors w-fit"
            >
              View Discography
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
