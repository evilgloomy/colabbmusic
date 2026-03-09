import { Link } from "react-router-dom";
import { getActiveCampaign } from "@/data/content";
import { Music, ExternalLink } from "lucide-react";

export const CurrentEra = () => {
  const campaign = getActiveCampaign();

  return (
    <section className="container mx-auto px-6 py-24 md:py-32">
      <div className="glass rounded-lg overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Cover art */}
          <div className="aspect-square md:aspect-auto overflow-hidden">
            <img
              src={campaign.coverImage}
              alt={campaign.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
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
              {campaign.title}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              {campaign.synopsis}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {campaign.genre && (
                <span className="px-3 py-1 border border-border rounded-sm">{campaign.genre}</span>
              )}
              {campaign.mood && (
                <span className="px-3 py-1 border border-border rounded-sm">{campaign.mood}</span>
              )}
            </div>

            {/* Streaming icons */}
            <div className="flex items-center gap-4">
              {campaign.spotifyUrl && (
                <a href={campaign.spotifyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Music className="h-4 w-4" /> Spotify
                </a>
              )}
              {campaign.appleMusicUrl && (
                <a href={campaign.appleMusicUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Music className="h-4 w-4" /> Apple Music
                </a>
              )}
              {campaign.youtubeUrl && (
                <a href={campaign.youtubeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ExternalLink className="h-4 w-4" /> YouTube
                </a>
              )}
            </div>

            <Link
              to="/music"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground text-xs font-medium tracking-wider uppercase rounded-sm hover:bg-primary/90 transition-colors w-fit"
            >
              Stream Here
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};