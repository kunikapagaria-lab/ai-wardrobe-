export type ClothingCategory =
  | "top" | "bottom" | "dress" | "outerwear" | "shoes"
  | "bag" | "accessory" | "activewear" | "co-ord" | "jumpsuit"
  | "traditional" | "necklace" | "ring" | "bracelet" | "bangle" | "other";

export type Occasion =
  | "work" | "casual" | "date" | "formal" | "party"
  | "beach" | "gym" | "travel" | "brunch" | "college";

export type Season = "spring" | "summer" | "autumn" | "winter" | "all-season";

export type ClothingStyle =
  | "casual" | "smart-casual" | "formal" | "business" | "streetwear"
  | "athleisure" | "bohemian" | "minimalist" | "vintage" | "ethnic" | "party";

export interface ClothingTags {
  category: ClothingCategory;
  colors: string[];
  style: ClothingStyle[];
  occasion: Occasion[];
  season: Season[];
  pattern?: string;
  material?: string;
  fit?: string;
  confidence: number;
}

export interface ClothingItem {
  id: string;
  user_id: string;
  photo_url: string;
  thumbnail_url?: string;
  tags: ClothingTags;
  name?: string;
  notes?: string;
  is_favorite: boolean;
  last_worn_at?: string;
  wear_count: number;
  outfit_photo_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OutfitPhotoAnalysis {
  overall_style: string[];
  occasion: string[];
  season: string[];
  pieces: Array<{ category: string; colors: string[]; description: string }>;
  caption_suggestion: string;
  confidence: number;
}

export interface OutfitPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  tags: OutfitPhotoAnalysis;
  caption?: string;
  worn_at: string;
  created_at: string;
}

export interface OutfitRecommendation {
  id: string;
  items: ClothingItem[];
  occasion: string;
  reasoning: string;
  style_notes: string;
}

export interface MixMatchSuggestion {
  id: string;
  items: ClothingItem[];
  headline: string;
  reasoning: string;
  is_new_pairing: boolean;
}

export interface SavedOutfit {
  id: string;
  user_id: string;
  item_ids: string[];
  occasion: string;
  reasoning?: string;
  style_notes?: string;
  created_at: string;
}

export interface PlannedOutfit {
  id: string;
  user_id: string;
  planned_date: string;
  item_ids: string[];
  occasion?: string;
  notes?: string;
  created_at: string;
}

export interface ShoppingSuggestion {
  id: string;
  item_name: string;
  category: ClothingCategory;
  colors: string[];
  style: ClothingStyle[];
  reasoning: string;
  pairs_with: ClothingItem[];
  image: string | null;
  shop_url: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  item_name: string;
  category: ClothingCategory;
  colors: string[];
  style: ClothingStyle[];
  reasoning?: string;
  pairs_with_item_ids: string[];
  image: string | null;
  shop_url: string;
  created_at: string;
}
