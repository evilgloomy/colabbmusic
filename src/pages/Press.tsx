import { useState, useEffect } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { fetchReleases, type YouTubeRelease } from "@/lib/youtube";
import { Download, Mail } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { useTranslation } from "react-i18next";
import { useBrand } from "@/hooks/useBrand";
import pressImg1 from "@/assets/press-1.jpg";
import pressImg2 from "@/assets/press-2.jpg";
import pressImg3 from "@/assets/press-3.jpg";
import pressImg4 from "@/assets/press-4.jpg";
import bannerPress from "@/assets/banner-press.jpg";

const pressImages = [
  { src: pressImg1, alt: "Cola B — Portrait 1" },
  { src: pressImg2, alt: "Cola B — Portrait 2" },
  { src: pressImg3, alt: "Cola B — Portrait 3" },
  { src: pressImg4, alt: "Cola B — Portrait 4" },
];

const PressPage = () => {
  const { t } = useTranslation();
  const brand = useBrand();

  useSEO({
    title: t("press.pageTitle") + " — Cola B",
    description: t("press.pageDesc"),
  });

  const [latestRelease, setLatestRelease] = useState<YouTubeRelease | null>(null);

  useEffect(() => {
    fetchReleases().then((releases) => {
      if (releases.length > 0) setLatestRelease(releases[0]);
    });
  }, []);

  return (
    <PageLayout>
      <section className="relative overflow-hidden">
        <img src={bannerPress} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/40" />
        <div className="relative container mx-auto px-6 py-32 md:py-40">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-4">{t("press.media")}</p>
          <h1 className="text-display-lg font-display font-bold text-foreground mb-6">{t("press.pageTitle")}</h1>
          <p className="text-muted-foreground max-w-lg">{t("press.pageDesc")}</p>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-3xl space-y-16">
            <div>
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">{t("press.shortBio")}</p>
              <p className="text-lg text-foreground leading-relaxed">{brand.shortBio}</p>
            </div>
            <div>
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">{t("press.biography")}</p>
              <p className="text-muted-foreground leading-relaxed">{brand.mediumBio}</p>
            </div>
            <div>
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">{t("press.extendedBiography")}</p>
              <div className="space-y-4">
                {brand.longBio.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed">{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {latestRelease && (
        <section className="bg-card/30">
          <div className="container mx-auto px-6 py-24">
            <div className="max-w-3xl">
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">{t("press.latestRelease")}</p>
              <h3 className="text-display-md font-display font-bold text-foreground mb-4">{latestRelease.title}</h3>
              {latestRelease.description && <p className="text-muted-foreground leading-relaxed mb-4">{latestRelease.description}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {latestRelease.release_date && <span className="px-3 py-1 border border-border rounded-sm">{latestRelease.release_date}</span>}
                {latestRelease.year && <span className="px-3 py-1 border border-border rounded-sm">{latestRelease.year}</span>}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-border/60">
        <div className="container mx-auto px-6 py-24">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-8">{t("press.pressImages")}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {pressImages.map((img, i) => (
              <div key={i} className="aspect-[3/4] rounded-lg overflow-hidden bg-card">
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="container mx-auto px-6 py-24">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">{t("press.pressKit")}</p>
              <p className="text-sm text-muted-foreground mb-6">{t("press.pressKitDesc")}</p>
              <a href="/Cola_B_Press_Kit.pdf" download="Cola_B_Press_Kit.pdf"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground text-xs font-medium tracking-wider uppercase rounded-sm hover:border-primary hover:text-primary transition-colors">
                <Download className="h-4 w-4" /> {t("press.downloadPressKit")}
              </a>
            </div>
            <div>
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">{t("press.inquiries")}</p>
              <p className="text-sm text-muted-foreground mb-6">{t("press.inquiriesDesc")}</p>
              <a href="mailto:press@colabmusic.com"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground text-xs font-medium tracking-wider uppercase rounded-sm hover:border-primary hover:text-primary transition-colors">
                <Mail className="h-4 w-4" /> {t("press.contact")}
              </a>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default PressPage;
