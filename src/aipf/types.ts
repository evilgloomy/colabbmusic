export interface AipfEntity {
  id: string;
  slug: string;
  entity_name: string;
  creator_studio_name: string | null;
  country_region: string | null;
  category: string | null;
  bio: string | null;
  official_image_url: string | null;
  logo_url: string | null;
  year_launched: number | null;
  follower_count: string | null;
  member_type: string | null;
  member_number: string | null;
  founding_cohort: boolean;
  verification_status: string;
  status_note: string | null;
  published: boolean;
  created_at?: string;
  updated_at?: string;
  is_sample?: boolean;
}

export interface AipfEntityLink {
  id: string;
  entity_id: string;
  platform: string | null;
  label: string | null;
  url: string;
  status: "active" | "broken" | "replaced" | "archived";
  priority: number;
  is_primary: boolean;
  show_publicly: boolean;
  last_checked: string | null;
  notes: string | null;
}

export interface AipfAchievement {
  id: string;
  entity_id: string;
  title: string;
  description: string | null;
  year: string | null;
  url: string | null;
}

export interface AipfJournalPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  post_type: string | null;
  published: boolean;
  created_at?: string;
  updated_at?: string;
}
