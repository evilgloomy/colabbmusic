import { Link } from "react-router-dom";
import { getFeaturedStories, getFeaturedVideo } from "@/data/content";
import { Play } from "lucide-react";

export const StoryPreview = () => {
  const stories = getFeaturedStories().slice(0, 3);
  const video = getFeaturedVideo();

  return (
    <section className="container mx-auto px-6 py-24 md:py-32">
      <div className="mb-12">
        <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-3">
          Explore
        </p>
        <h2 className="text-display-md font-display font-bold text-foreground">
          Inside Cola's World
        </h2>
      </div>

      {/* Two-column layout: stories + video */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Life, Travel & Style card */}
        <div className="glass rounded-lg overflow-hidden group">
          <div className="aspect-[4/3] relative overflow-hidden">
            <img
              src={stories[0]?.image || "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80"}
              alt="Life, Travel & Style"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-primary-foreground/80 mb-1">
                Stories
              </p>
              <h3 className="font-display text-lg font-medium text-primary-foreground">
                Life, Travel & Style
              </h3>
            </div>
          </div>
          {/* Small story thumbnails */}
          <div className="p-4 flex gap-3">
            {stories.slice(0, 3).map((story) => (
              <div key={story.id} className="flex-1 aspect-square rounded-sm overflow-hidden">
                <img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        {/* New Video card */}
        {video && (
          <div className="glass rounded-lg overflow-hidden group">
            <div className="aspect-[4/3] relative overflow-hidden">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-foreground/20 group-hover:bg-foreground/10 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all">
                  <Play className="h-6 w-6 text-primary-foreground ml-1" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-xs font-medium tracking-[0.2em] uppercase text-primary-foreground/80 mb-1">
                  New Video
                </p>
                <h3 className="font-display text-lg font-medium text-primary-foreground">
                  {video.title}
                </h3>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap gap-4">
        <Link
          to="/story"
          className="text-xs font-medium tracking-widest uppercase text-primary hover:text-foreground transition-colors"
        >
          View All Stories →
        </Link>
        <Link
          to="/store"
          className="text-xs font-medium tracking-widest uppercase text-primary hover:text-foreground transition-colors"
        >
          Visit the Store →
        </Link>
      </div>
    </section>
  );
};