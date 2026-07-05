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

export interface AipfClaimLookup {
  found: boolean;
  claimable?: boolean;
  reason?: "already_claimed" | "not_claimable";
  member_type?: string | null;
  member_number?: string | null;
  entity_name?: string | null;
  creator_studio_name?: string | null;
  country_region?: string | null;
  category?: string | null;
  bio?: string | null;
  official_image_url?: string | null;
  logo_url?: string | null;
  year_launched?: number | null;
  follower_count?: string | null;
}

export interface AipfClaimLinkDraft {
  platform: string;
  url: string;
}

export interface AipfOnboardingPayload {
  entity_name: string;
  creator_studio_name?: string;
  country_region?: string;
  category?: string;
  bio?: string;
  official_image_url?: string;
  logo_url?: string;
  year_launched?: string;
  follower_count?: string;
  contact_email?: string;
  links: AipfClaimLinkDraft[];
  accepted_principles: boolean;
  oath_signature: string;
}

export interface AipfOnboardingSubmission {
  id: string;
  invitation_id: string;
  entity_id: string | null;
  entity_name: string;
  creator_studio_name: string | null;
  country_region: string | null;
  category: string | null;
  bio: string | null;
  official_image_url: string | null;
  logo_url: string | null;
  year_launched: number | null;
  follower_count: string | null;
  contact_email: string | null;
  links: AipfClaimLinkDraft[] | null;
  accepted_principles: boolean;
  oath_signature: string;
  oath_signed_at: string | null;
  status: "submitted" | "approved" | "rejected";
  internal_notes: string | null;
  created_at?: string;
  updated_at?: string;
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
