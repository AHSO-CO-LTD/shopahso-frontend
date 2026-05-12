// ─── Home Section Types ────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  partNumber: string;
  brand: string;
  imageUrl: string | null;
  category: string;
  isNew?: boolean;
  isFeatured?: boolean;
  arrivedAt?: string; // ISO date string, for New Arrivals
}

export interface Brand {
  id: string;
  name: string;
  logoUrl: string | null;
  /** slug used for routing to /brands/[slug] */
  slug: string;
}
