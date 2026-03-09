import { PageLayout } from "@/components/layout/PageLayout";
import { videos, getFeaturedVideo } from "@/data/content";
import { Play } from "lucide-react";
import { useState } from "react";

const VideosPage = () => {
  const featured = getFeaturedVideo();
  const [playingId, setPlayingId] = useState<string | null>(null);

  return (
    <PageLayout>
      {/* Hero */}
      <section className="container mx-auto px-6 py-32 md:py-40">
        <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-4">Visual</p>
        <h1 className="text-display-lg font-display font-bold text-foreground mb-6">Videos</h1>
        <p className="text-muted-foreground max-w-lg">
          Official music videos, behind-the-scenes footage, and visual moments.
        </p>
      </section>

      {/* Featured video */}
      {featured && (
        <section className="container mx-auto px-6 pb-16">
          <div className="relative aspect-video overflow-hidden bg-card">
            {playingId === featured.id ? (
              <iframe
                src={`${featured.embedUrl}?autoplay=1`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={featured.title}
              />
            ) : (
              <button
                onClick={() => setPlayingId(featured.id)}
                className="w-full h-full relative group cursor-pointer"
              >
                <img src={featured.thumbnail} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-background/30 group-hover:bg-background/20 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border-2 border-foreground/60 flex items-center justify-center group-hover:border-primary group-hover:scale-110 transition-all">
                    <Play className="h-8 w-8 text-foreground ml-1" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-primary mb-1">{featured.type.replace("-", " ")}</p>
                  <h3 className="font-display text-lg md:text-xl font-medium text-foreground">{featured.title}</h3>
                </div>
              </button>
            )}
          </div>
        </section>
      )}

      {/* All videos */}
      <section className="container mx-auto px-6 pb-24">
        <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-8">All Videos</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((video) => (
            <div key={video.id} className="group">
              <div className="relative aspect-video overflow-hidden bg-card mb-4">
                {playingId === video.id ? (
                  <iframe
                    src={`${video.embedUrl}?autoplay=1`}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                    title={video.title}
                  />
                ) : (
                  <button
                    onClick={() => setPlayingId(video.id)}
                    className="w-full h-full relative cursor-pointer"
                  >
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-background/20 group-hover:bg-background/10 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full border border-foreground/40 flex items-center justify-center group-hover:border-primary transition-colors">
                        <Play className="h-5 w-5 text-foreground ml-0.5" />
                      </div>
                    </div>
                  </button>
                )}
              </div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1">{video.type.replace("-", " ")}</p>
              <h3 className="font-display text-sm font-medium text-foreground">{video.title}</h3>
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  );
};

export default VideosPage;
