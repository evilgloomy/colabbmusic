import { useTranslation } from "react-i18next";

const SPOTIFY_ARTIST_ID = "3LrZ1mrMzMFm5forQrdBVn";

export const SpotifyFollow = () => {
  const { t } = useTranslation();
  return (
    <section className="bg-background py-12 md:py-16 border-b border-border/30">
      <div className="editorial">
        <div className="max-w-2xl mx-auto">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-muted-foreground mb-3 text-center">
            {t("home.followOnSpotify", "Follow on Spotify")}
          </p>
          <iframe
            title="Spotify — Follow Cola B"
            src={`https://open.spotify.com/embed/artist/${SPOTIFY_ARTIST_ID}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            frameBorder={0}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="block w-full"
          />
        </div>
      </div>
    </section>
  );
};
