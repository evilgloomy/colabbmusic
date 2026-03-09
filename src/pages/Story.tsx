import { useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { storyEntries, type StoryEntry } from "@/data/content";

const categories = [
  "all", "music", "travel", "fashion", "events", "studio", "lifestyle", "humor",
] as const;

const StoryPage = () => {
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all"
    ? storyEntries
    : storyEntries.filter((s) => s.category === filter);

  return (
    <PageLayout>
      {/* Hero */}
      <section className="container mx-auto px-6 py-32 md:py-40">
        <p className="text-xs font-medium tracking-[0.3em] uppercase text-primary mb-4">Her World</p>
        <h1 className="text-display-lg font-display font-bold text-foreground mb-6">Story</h1>
        <p className="text-muted-foreground max-w-lg">
          Music, cities, moments, and everything in between. A living archive of Cola B's world.
        </p>
      </section>

      {/* Filter bar */}
      <section className="border-y border-border/40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 text-xs font-medium tracking-wider uppercase transition-colors ${
                  filter === cat
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Story grid — editorial masonry-like layout */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filtered.map((story, i) => (
            <StoryCard key={story.id} story={story} size={i % 5 === 0 ? "large" : "normal"} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-center py-20">No stories in this category yet.</p>
        )}
      </section>
    </PageLayout>
  );
};

const StoryCard = ({ story, size }: { story: StoryEntry; size: "large" | "normal" }) => {
  const isLarge = size === "large";

  return (
    <div className={`group ${isLarge ? "md:col-span-2 md:row-span-2" : ""}`}>
      <div className={`relative overflow-hidden ${isLarge ? "aspect-[4/3]" : "aspect-square"}`}>
        <img
          src={story.image}
          alt={story.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-primary">
              {story.category}
            </span>
            {story.location && (
              <span className="text-[10px] text-muted-foreground">· {story.location}</span>
            )}
          </div>
          <h3 className={`font-display font-medium text-foreground ${isLarge ? "text-lg md:text-xl" : "text-sm"}`}>
            {story.title}
          </h3>
          <p className={`text-muted-foreground mt-1 ${isLarge ? "text-sm" : "text-xs"} line-clamp-2`}>
            {story.caption}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-2">
            {new Date(story.date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StoryPage;
