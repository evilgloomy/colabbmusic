import { Link } from "react-router-dom";
import { getFeaturedStories } from "@/data/content";

export const StoryPreview = () => {
  const stories = getFeaturedStories().slice(0, 4);

  return (
    <section className="container mx-auto px-6 py-24 md:py-32">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-xs font-medium tracking-[0.3em] uppercase text-muted-foreground mb-3">
            Her World
          </p>
          <h2 className="text-display-md font-display font-bold text-foreground">
            Story
          </h2>
        </div>
        <Link
          to="/story"
          className="text-xs font-medium tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
        >
          View All →
        </Link>
      </div>

      {/* Desktop: horizontal editorial strip */}
      <div className="hidden md:grid grid-cols-4 gap-6">
        {stories.map((story, i) => (
          <Link
            key={story.id}
            to="/story"
            className={`group block ${i === 0 ? "col-span-2 row-span-2" : ""}`}
          >
            <div className={`relative overflow-hidden ${i === 0 ? "aspect-[4/3]" : "aspect-square"}`}>
              <img
                src={story.image}
                alt={story.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-primary mb-1">
                  {story.category} {story.location && `· ${story.location}`}
                </p>
                <h3 className="font-display text-sm font-medium text-foreground">
                  {story.title}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-6">
        {stories.slice(0, 3).map((story) => (
          <Link key={story.id} to="/story" className="group block">
            <div className="relative aspect-[16/9] overflow-hidden">
              <img
                src={story.image}
                alt={story.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-primary mb-1">
                  {story.category} {story.location && `· ${story.location}`}
                </p>
                <h3 className="font-display text-sm font-medium text-foreground">
                  {story.title}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
