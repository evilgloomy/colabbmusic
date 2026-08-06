import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Reveal, Kicker } from "@/components/editorial/Reveal";
import { publishableOnly, isPublishableStory } from "@/lib/publishable";
import { trackStoryOpen } from "@/lib/analytics";
import cityNight from "@/assets/campaign/city-night.jpg";

interface Story {
  id: string;
  ai_title: string | null;
  ai_enhanced_text: string | null;
  category: string | null;
  media_url: string | null;
  posted_at: string | null;
}

export const WorldSection = () => {
  const { t } = useTranslation();
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    supabase
      .from("stories")
      .select("id, ai_title, ai_enhanced_text, category, media_url, posted_at")
      .order("posted_at", { ascending: false })
      .limit(9)
      .then(({ data }) =>
        setStories(publishableOnly((data as Story[]) || [], isPublishableStory, "home/world").slice(0, 3)),
      );
  }, []);

  return (
    <section className="bg-cola-ink band">
      <div className="editorial">
        <Reveal className="grid md:grid-cols-12 gap-10 items-end">
          <div className="md:col-span-6">
            <Kicker>{t("hp.worldLabel")}</Kicker>
            <h2 className="font-display text-section mt-4 text-balance">{t("hp.worldTitle")}</h2>
          </div>
          <p className="md:col-span-5 md:col-start-8 text-muted-foreground text-body-lg">{t("hp.worldBody")}</p>
        </Reveal>

        <Reveal delay={100} className="mt-14">
          <div className="aspect-[21/9] overflow-hidden">
            <img src={cityNight} alt="Cola B — night scene" loading="lazy" className="h-full w-full object-cover" />
          </div>
        </Reveal>

        {stories.length > 0 && (
          <div className="mt-14 grid md:grid-cols-3 gap-10">
            {stories.map((s, i) => (
              <Reveal key={s.id} delay={i * 80}>
                <Link to={`/story/${s.id}`} className="group block" onClick={() => trackStoryOpen(s.id, "home_world")}>
                  <div className="rule mb-5" />
                  <p className="label text-cola-pearl/40">{s.category || "Journal"}</p>
                  <h3 className="font-display text-display-md mt-3 group-hover:text-cola-pink transition-colors">
                    {s.ai_title || "Untitled"}
                  </h3>
                  {s.ai_enhanced_text && (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-3 font-editorial-cjk">
                      {s.ai_enhanced_text}
                    </p>
                  )}
                </Link>
              </Reveal>
            ))}
          </div>
        )}

        <Reveal delay={120}>
          <Link
            to="/story"
            className="mt-14 inline-block label border-b border-cola-pearl/30 pb-1 hover:text-cola-pink hover:border-cola-pink transition-colors"
          >
            {t("hp.worldCta")} →
          </Link>
        </Reveal>
      </div>
    </section>
  );
};
