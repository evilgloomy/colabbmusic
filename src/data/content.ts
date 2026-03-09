// Static content layer for Phase 1
// Will be migrated to Supabase in Phase 2

export interface Release {
  id: string;
  slug: string;
  title: string;
  releaseType: "single" | "ep" | "album" | "cover" | "collaboration";
  releaseDate: string;
  year: number;
  isActiveCampaign: boolean;
  synopsis: string;
  coverImage: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  youtubeUrl?: string;
  soundcloudUrl?: string;
  genre?: string;
  mood?: string;
}

export interface StoryEntry {
  id: string;
  title: string;
  slug: string;
  date: string;
  category: "music" | "travel" | "fashion" | "events" | "studio" | "lifestyle" | "humor";
  caption: string;
  location?: string;
  image: string;
  relatedReleaseId?: string;
  featured: boolean;
}

export interface Video {
  id: string;
  title: string;
  publishDate: string;
  type: "music-video" | "short" | "behind-the-scenes" | "live";
  thumbnail: string;
  embedUrl: string;
  relatedReleaseId?: string;
  featured: boolean;
}

// ─── Brand Constants ───────────────────────────────────────────

export const brand = {
  name: "Cola B",
  tagline: "Singer-songwriter. Cultural personality. A world built through music, style, and moments.",
  shortBio:
    "Cola B is a singer-songwriter and digital cultural personality whose world spans music, lifestyle, travel, and modern internet life.",
  mediumBio:
    "Cola B is a singer-songwriter and digital cultural personality building a world through music, style, cities, and modern internet life. Her work blends emotional songwriting with a cinematic visual identity — creating an artist universe that extends far beyond the music itself. Every release is a chapter, every moment is a story.",
  longBio:
    "Cola B is a singer-songwriter and digital cultural personality whose creative universe spans music, lifestyle, travel, luxury aesthetics, humor, and storytelling. Her artistry is rooted in emotional, contemporary songwriting — but her world extends into every corner of modern culture. From city streets to studio sessions, from fashion to humor, Cola B builds a living, breathing world that invites audiences to step inside.\n\nHer music draws from pop, R&B, and alternative influences, delivered with a voice that balances vulnerability and confidence. Each release is conceived as part of a larger narrative — an era, a mood, a visual identity. Cola B doesn't just release songs; she releases worlds.\n\nAs a digital personality, she brings the same intentionality to her online presence: stylish, culturally aware, emotionally intelligent, and always unmistakably herself. Cola B is the headquarters of a new kind of artist — one whose brand, music, and life are inseparable.",
  studioName: "Shiba Inu Media",
  studioStatement:
    "Shiba Inu Media is the independent creative studio behind Cola B — handling music production, visual direction, brand strategy, and digital world-building.",
};

// ─── Releases ──────────────────────────────────────────────────

export const releases: Release[] = [
  {
    id: "r1",
    slug: "midnight-honey",
    title: "Midnight Honey",
    releaseType: "single",
    releaseDate: "2026-02-14",
    year: 2026,
    isActiveCampaign: true,
    synopsis:
      "A velvet-smooth late-night anthem about the sweetness of solitude and the glow of city lights after dark. Midnight Honey is Cola B at her most intimate and atmospheric.",
    coverImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    spotifyUrl: "#",
    appleMusicUrl: "#",
    youtubeUrl: "#",
    genre: "Alternative Pop",
    mood: "Intimate, Atmospheric",
  },
  {
    id: "r2",
    slug: "golden-hour-drive",
    title: "Golden Hour Drive",
    releaseType: "single",
    releaseDate: "2025-10-20",
    year: 2025,
    isActiveCampaign: false,
    synopsis:
      "Sun-drenched windows-down energy. A song about chasing the light before it disappears — and the people who make you feel infinite.",
    coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
    spotifyUrl: "#",
    appleMusicUrl: "#",
    youtubeUrl: "#",
    genre: "Pop",
    mood: "Euphoric, Warm",
  },
  {
    id: "r3",
    slug: "velvet-static",
    title: "Velvet Static",
    releaseType: "ep",
    releaseDate: "2025-06-01",
    year: 2025,
    isActiveCampaign: false,
    synopsis:
      "A 5-track EP exploring the tension between digital connection and real intimacy. Lush production, sharp lyrics, cinematic scope.",
    coverImage: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&q=80",
    spotifyUrl: "#",
    appleMusicUrl: "#",
    genre: "R&B / Pop",
    mood: "Moody, Cinematic",
  },
  {
    id: "r4",
    slug: "neon-prayers",
    title: "Neon Prayers",
    releaseType: "single",
    releaseDate: "2025-03-15",
    year: 2025,
    isActiveCampaign: false,
    synopsis:
      "A late-night confessional wrapped in shimmering synths. About saying things you can only say when the city is asleep.",
    coverImage: "https://images.unsplash.com/photo-1571266028243-d220c6a8b0e5?w=800&q=80",
    spotifyUrl: "#",
    appleMusicUrl: "#",
    genre: "Synth-Pop",
    mood: "Reflective, Luminous",
  },
  {
    id: "r5",
    slug: "soft-armor",
    title: "Soft Armor",
    releaseType: "single",
    releaseDate: "2024-11-08",
    year: 2024,
    isActiveCampaign: false,
    synopsis: "A power ballad about vulnerability as strength. Stripped-back production, soaring vocal.",
    coverImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
    spotifyUrl: "#",
    appleMusicUrl: "#",
    genre: "Alternative",
    mood: "Powerful, Tender",
  },
];

// ─── Story Entries ─────────────────────────────────────────────

export const storyEntries: StoryEntry[] = [
  {
    id: "s1",
    title: "Midnight Honey Sessions",
    slug: "midnight-honey-sessions",
    date: "2026-02-10",
    category: "studio",
    caption: "Final vocal takes for Midnight Honey. The magic hour when everything clicks.",
    location: "Los Angeles",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80",
    relatedReleaseId: "r1",
    featured: true,
  },
  {
    id: "s2",
    title: "Tokyo After Dark",
    slug: "tokyo-after-dark",
    date: "2026-01-22",
    category: "travel",
    caption: "Shibuya at 2 AM. Every city has a frequency — Tokyo's is electric.",
    location: "Tokyo",
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    featured: true,
  },
  {
    id: "s3",
    title: "Listening Party",
    slug: "listening-party",
    date: "2025-12-15",
    category: "events",
    caption: "An intimate evening with the people who make this all possible.",
    location: "New York",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
    featured: true,
  },
  {
    id: "s4",
    title: "Off-Duty in Milan",
    slug: "off-duty-milan",
    date: "2025-11-03",
    category: "fashion",
    caption: "Between shows. The quiet moments are the real luxury.",
    location: "Milan",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80",
    featured: false,
  },
  {
    id: "s5",
    title: "Studio Views",
    slug: "studio-views",
    date: "2025-09-18",
    category: "studio",
    caption: "Early mornings, late nights. The in-between is where songs live.",
    image: "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?w=800&q=80",
    featured: false,
  },
  {
    id: "s6",
    title: "Sunset Ritual",
    slug: "sunset-ritual",
    date: "2025-08-22",
    category: "lifestyle",
    caption: "Golden hour is non-negotiable.",
    location: "Malibu",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    featured: false,
  },
  {
    id: "s7",
    title: "The Look™",
    slug: "the-look",
    date: "2025-07-10",
    category: "humor",
    caption: "When someone asks if you've heard their SoundCloud.",
    image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&q=80",
    featured: false,
  },
  {
    id: "s8",
    title: "Paris Writing Sessions",
    slug: "paris-writing-sessions",
    date: "2025-06-05",
    category: "music",
    caption: "Some songs can only be written in certain cities.",
    location: "Paris",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
    relatedReleaseId: "r3",
    featured: true,
  },
];

// ─── Videos ────────────────────────────────────────────────────

export const videos: Video[] = [
  {
    id: "v1",
    title: "Midnight Honey (Official Video)",
    publishDate: "2026-02-14",
    type: "music-video",
    thumbnail: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    relatedReleaseId: "r1",
    featured: true,
  },
  {
    id: "v2",
    title: "Golden Hour Drive (Official Video)",
    publishDate: "2025-10-25",
    type: "music-video",
    thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    relatedReleaseId: "r2",
    featured: false,
  },
  {
    id: "v3",
    title: "Behind the Scenes: Velvet Static",
    publishDate: "2025-06-10",
    type: "behind-the-scenes",
    thumbnail: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&q=80",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    relatedReleaseId: "r3",
    featured: false,
  },
];

// ─── Helpers ───────────────────────────────────────────────────

export function getActiveCampaign() {
  return releases.find((r) => r.isActiveCampaign) || releases[0];
}

export function getLatestRelease() {
  return [...releases].sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())[0];
}

export function getFeaturedStories() {
  return storyEntries.filter((s) => s.featured);
}

export function getFeaturedVideo() {
  return videos.find((v) => v.featured) || videos[0];
}

export function getReleasesByType(type: Release["releaseType"]) {
  return releases.filter((r) => r.releaseType === type);
}
