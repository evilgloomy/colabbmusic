import { Link } from "react-router-dom";
import { getActiveCampaign } from "@/data/content";
import { Music, ExternalLink } from "lucide-react";

export const CurrentEra = () => {
  const campaign = getActiveCampaign();

  return (
    <section className="container mx-auto px-6 py-24 md:py-32">
      <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        {/* Cover art */}
        <div className="relative">
          <div className="aspect-square overflow-hidden">
            <img
              src={campaign.coverImage}
              alt={campaign.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="absolute -bottom-4 -right-4 w-2/3 h-2/3 border border-primary/20 -z-10" />
        </div>

        {/* Info */}
        <div className="space-y-6">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary">
            Latest Release
          </p>
          <h2 className="text-display-lg font-display font-bold text-foreground">
            {campaign.title}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {campaign.synopsis}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {campaign.genre && <span className="px-3 py-1 border border-border">{campaign.genre}</span>}
            {campaign.mood && <span className="px-3 py-1 border border-border">{campaign.mood}</span>}
          </div>
          <div className="flex items-center gap-4 pt-4">
            {campaign.spotifyUrl && (
              <a href={campaign.spotifyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Music className="h-4 w-4" /> Spotify
              </a>
            )}
            {campaign.appleMusicUrl && (
              <a href={campaign.appleMusicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Music className="h-4 w-4" /> Apple Music
              </a>
            )}
            {campaign.youtubeUrl && (
              <a href={campaign.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="h-4 w-4" /> YouTube
              </a>
            )}
          </div>
          <Link
            to="/music"
            className="inline-block mt-4 text-xs font-medium tracking-widest uppercase text-primary hover:text-foreground transition-colors"
          >
            View Full Discography →
          </Link>
        </div>
      </div>
    </section>
  );
};
