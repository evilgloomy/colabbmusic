import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Music } from "lucide-react";
import { fetchReleases, type YouTubeRelease } from "@/lib/youtube";
import { Reveal, Kicker } from "@/components/editorial/Reveal";

export const MusicUniverse = () => {
  const { t } = useTranslation();
  const [releases, setReleases] = useState<YouTubeRelease[]>([]);

  useEffect(() => {
    fetchReleases().then((all) => setReleases(all.slice(0, 8)));
  }, []);

  if (releases.length === 0) return null;

  const [lead, ...rest] = releases;
  const leadThumb = lead.thumbnail_url?.replace(/&amp;/g, "&");

  return (
    <section className="bg-cola-ink band">
      <div className="editorial">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Kicker>{t("hp.musicLabel")}</Kicker>
            <h2 className="font-display text-section mt-4">{t("hp.musicTitle")}</h2>
            <p className="mt-4 text-muted-foreground max-w-md">{t("hp.musicBody")}</p>
          </div>
          <Link to="/music" className="label text-cola-pearl/60 hover:text-cola-pink transition-colors">
            {t("hp.musicAll")} →
          </Link>
        </Reveal>

        <div className="rule my-12" />

        <div className="grid md:grid-cols-12 gap-10">
          {/* Lead release — oversized */}
          <Reveal className="md:col-span-6">
            <Link to={`/release/${lead.id}`} className="group block">
              <div className="aspect-square overflow-hidden bg-cola-surface">
                {leadThumb ? (
                  <img
                    src={leadThumb}
                    alt={lead.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="h-full w-full grid place-items-center text-muted-foreground">
                    <Music className="h-8 w-8" />
                  </div>
                )}
              </div>
              <h3 className="font-display text-display-md mt-6 group-hover:text-cola-pink transition-colors">
                {lead.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{lead.year}</p>
            </Link>
          </Reveal>

          {/* Shelf */}
          <div className="md:col-span-6 grid grid-cols-2 gap-x-6 gap-y-10 content-start">
            {rest.slice(0, 6).map((r, i) => {
              const thumb = r.thumbnail_url?.replace(/&amp;/g, "&");
              return (
                <Reveal key={r.id} delay={i * 60}>
                  <Link to={`/release/${r.id}`} className="group block">
                    <div className="aspect-square overflow-hidden bg-cola-surface">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={r.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.05]"
                        />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-muted-foreground">
                          <Music className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-medium mt-3 group-hover:text-cola-pink transition-colors">{r.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.year}
                      {r.track_count && r.track_count > 1 ? ` · ${r.track_count}` : ""}
                    </p>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
