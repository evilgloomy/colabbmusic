import { PageLayout } from "@/components/layout/PageLayout";
import { brand, getActiveCampaign } from "@/data/content";
import { Download, Mail } from "lucide-react";

const PressPage = () => {
  const latestRelease = getActiveCampaign();

  return (
    <PageLayout>
      {/* Hero */}
      <section className="container mx-auto px-6 py-32 md:py-40">
        <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-4">Media</p>
        <h1 className="text-display-lg font-display font-bold text-foreground mb-6">Press</h1>
        <p className="text-muted-foreground max-w-lg">
          Official press materials, bios, and media assets for Cola B.
        </p>
      </section>

      {/* Bios */}
      <section className="border-t border-border/40">
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-3xl space-y-16">
            {/* Short bio */}
            <div>
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">
                Short Bio
              </p>
              <p className="text-lg text-foreground leading-relaxed">
                {brand.shortBio}
              </p>
            </div>

            {/* Medium bio */}
            <div>
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">
                Biography
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {brand.mediumBio}
              </p>
            </div>

            {/* Long bio */}
            <div>
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">
                Extended Biography
              </p>
              <div className="space-y-4">
                {brand.longBio.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest release note */}
      <section className="bg-card/30">
        <div className="container mx-auto px-6 py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Latest Release
            </p>
            <h3 className="text-display-md font-display font-bold text-foreground mb-4">
              {latestRelease.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">{latestRelease.synopsis}</p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="px-3 py-1 border border-border">{latestRelease.releaseDate}</span>
              {latestRelease.genre && <span className="px-3 py-1 border border-border">{latestRelease.genre}</span>}
            </div>
          </div>
        </div>
      </section>

      {/* Press images placeholder */}
      <section className="border-t border-border/40">
        <div className="container mx-auto px-6 py-24">
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-8">
            Press Images
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] bg-card flex items-center justify-center">
                <span className="text-xs text-muted-foreground">Image {i}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press kit / contact */}
      <section className="border-t border-border/40">
        <div className="container mx-auto px-6 py-24">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">
                Press Kit
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Download the complete press kit including high-resolution images, bio, and release information.
              </p>
              <button className="inline-flex items-center gap-2 px-6 py-3 border border-foreground/20 text-foreground text-xs font-medium tracking-wider uppercase hover:border-foreground/50 transition-colors">
                <Download className="h-4 w-4" /> Download Press Kit
              </button>
            </div>
            <div>
              <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-4">
                Inquiries
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                For press inquiries, booking, and collaboration requests.
              </p>
              <a
                href="mailto:press@colabmusic.com"
                className="inline-flex items-center gap-2 px-6 py-3 border border-foreground/20 text-foreground text-xs font-medium tracking-wider uppercase hover:border-foreground/50 transition-colors"
              >
                <Mail className="h-4 w-4" /> Contact
              </a>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default PressPage;
