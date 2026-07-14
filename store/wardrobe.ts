"use client";
import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { uploadPhoto, uploadBase64, deletePhoto } from "@/lib/supabase/storage";
import type { ClothingItem, OutfitPhoto, SavedOutfit, PlannedOutfit, ShoppingSuggestion, WishlistItem } from "@/types";

interface WardrobeState {
  items: ClothingItem[];
  outfitPhotos: OutfitPhoto[];
  savedOutfits: SavedOutfit[];
  plannedOutfits: PlannedOutfit[];
  wishlistItems: WishlistItem[];
  loading: boolean;
  uploading: boolean;

  fetchAll: () => Promise<void>;

  // Items
  addItem: (file: File) => Promise<ClothingItem | null>;
  deleteItem: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<Pick<ClothingItem, "name" | "notes" | "is_favorite" | "tags">>) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  logWear: (id: string) => Promise<void>;
  generateCutouts: () => Promise<number>;

  // Looks
  addOutfitPhoto: (file: File) => Promise<{ photo: OutfitPhoto; importedCount: number } | null>;
  deleteOutfitPhoto: (id: string) => Promise<void>;

  // Saved outfits
  saveOutfit: (outfit: { item_ids: string[]; occasion: string; reasoning?: string; style_notes?: string }) => Promise<void>;
  removeSavedOutfit: (id: string) => Promise<void>;

  // Calendar
  planOutfit: (date: string, item_ids: string[], occasion?: string, notes?: string) => Promise<void>;
  removePlannedOutfit: (id: string) => Promise<void>;

  // Wishlist
  saveToWishlist: (suggestion: ShoppingSuggestion) => Promise<void>;
  removeFromWishlist: (id: string) => Promise<void>;
}

async function callApi<T>(path: string, body: object): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `API error ${res.status}`);
  return data as T;
}

// getUser() hits the network — a transient failure must not become an
// unhandled rejection, since several callers below run unattended from
// page-mount effects with no caller-side try/catch. Treat a network failure
// the same as "no session".
async function getUserSafe(supabase: ReturnType<typeof createClient>) {
  try {
    return (await supabase.auth.getUser()).data.user;
  } catch {
    return null;
  }
}

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  items: [],
  outfitPhotos: [],
  savedOutfits: [],
  plannedOutfits: [],
  wishlistItems: [],
  loading: false,
  uploading: false,

  fetchAll: async () => {
    set({ loading: true });
    const supabase = createClient();
    const user = await getUserSafe(supabase);
    if (!user) { set({ loading: false }); return; }

    const [items, photos, saved, planned, wishlist] = await Promise.all([
      supabase.from("clothing_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("outfit_photos").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("saved_outfits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("planned_outfits").select("*").eq("user_id", user.id).order("planned_date", { ascending: true }),
      supabase.from("wishlist_items").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    set({
      items: (items.data ?? []) as ClothingItem[],
      outfitPhotos: (photos.data ?? []) as OutfitPhoto[],
      savedOutfits: (saved.data ?? []) as SavedOutfit[],
      plannedOutfits: (planned.data ?? []) as PlannedOutfit[],
      wishlistItems: (wishlist.data ?? []) as WishlistItem[],
      loading: false,
    });
  },

  addItem: async (file) => {
    set({ uploading: true });
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const photoUrl = await uploadPhoto(file, user.id);

      // Background removal — non-fatal
      let thumbnailUrl: string | undefined;
      try {
        const { base64 } = await callApi<{ base64: string }>("/api/remove-bg", { photoUrl });
        thumbnailUrl = await uploadBase64(base64, user.id);
      } catch { /* skip */ }

      const { tags } = await callApi<{ tags: ClothingItem["tags"] }>("/api/analyze", { photoUrl });

      const { data, error } = await supabase
        .from("clothing_items")
        .insert({ user_id: user.id, photo_url: photoUrl, thumbnail_url: thumbnailUrl ?? null, tags })
        .select().single();

      if (error) throw new Error(error.message);

      const newItem = data as ClothingItem;
      set((s) => ({ items: [newItem, ...s.items] }));
      return newItem;
    } catch (err) {
      throw err;
    } finally {
      set({ uploading: false });
    }
  },

  deleteItem: async (id) => {
    const supabase = createClient();
    const item = get().items.find((i) => i.id === id);
    if (!item) return;

    const { error } = await supabase.from("clothing_items").delete().eq("id", id);
    if (error) throw new Error(error.message);

    await deletePhoto(item.photo_url);
    if (item.thumbnail_url) await deletePhoto(item.thumbnail_url);
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },

  updateItem: async (id, updates) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("clothing_items")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id).select().single();
    if (error) throw new Error(error.message);
    set((s) => ({ items: s.items.map((i) => (i.id === id ? (data as ClothingItem) : i)) }));
  },

  toggleFavorite: async (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    await get().updateItem(id, { is_favorite: !item.is_favorite });
  },

  logWear: async (id) => {
    const supabase = createClient();
    const user = await getUserSafe(supabase);
    if (!user) return;
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    const now = new Date().toISOString();
    await supabase.from("wear_logs").insert({ user_id: user.id, item_id: id, worn_at: now });
    await get().updateItem(id, {});
    const { data } = await supabase
      .from("clothing_items")
      .update({ last_worn_at: now, wear_count: (item.wear_count ?? 0) + 1, updated_at: now })
      .eq("id", id).select().single();
    if (data) set((s) => ({ items: s.items.map((i) => (i.id === id ? (data as ClothingItem) : i)) }));
  },

  generateCutouts: async () => {
    const supabase = createClient();
    const user = await getUserSafe(supabase);
    if (!user) return 0;

    const needsCutout = get().items.filter((i) => !i.thumbnail_url);
    if (needsCutout.length === 0) return 0;

    let processed = 0;
    for (const item of needsCutout) {
      try {
        // Use segment-item: crops to just this clothing piece, removes bg, excludes face
        const { base64 } = await callApi<{ base64: string }>("/api/segment-item", {
          photoUrl: item.photo_url,
          category: item.tags.category,
          description: item.name ?? item.tags.category,
        });
        const cutoutUrl = await uploadBase64(base64, user.id);
        await supabase.from("clothing_items").update({ thumbnail_url: cutoutUrl }).eq("id", item.id);
        set((s) => ({
          items: s.items.map((i) => i.id === item.id ? { ...i, thumbnail_url: cutoutUrl } : i),
        }));
        processed++;
        await new Promise((r) => setTimeout(r, 800));
      } catch { /* skip failed items */ }
    }
    return processed;
  },

  addOutfitPhoto: async (file) => {
    set({ uploading: true });
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const photoUrl = await uploadPhoto(file, user.id);
      const { analysis } = await callApi<{ analysis: OutfitPhoto["tags"] }>("/api/analyze-outfit", { photoUrl });

      const { data: photoData, error: photoErr } = await supabase
        .from("outfit_photos")
        .insert({ user_id: user.id, photo_url: photoUrl, tags: analysis, caption: analysis.caption_suggestion, worn_at: new Date().toISOString() })
        .select().single();

      if (photoErr) throw new Error(photoErr.message);
      const photo = photoData as OutfitPhoto;
      set((s) => ({ outfitPhotos: [photo, ...s.outfitPhotos] }));

      // Import detected pieces — each gets its own per-item crop + bg removal
      const pieces = analysis.pieces ?? [];
      let importedCount = 0;
      if (pieces.length > 0) {
        // Insert pieces first without thumbnails
        const rows = pieces.map((piece) => ({
          user_id: user.id,
          photo_url: photoUrl,
          thumbnail_url: null as string | null,
          tags: {
            category: piece.category,
            colors: piece.colors,
            style: analysis.overall_style,
            occasion: analysis.occasion,
            season: analysis.season,
            pattern: "unknown",
            material: "unknown",
            fit: "unknown",
            confidence: analysis.confidence,
          },
          name: piece.description,
          outfit_photo_id: photo.id,
          last_worn_at: photo.worn_at,
          wear_count: 1,
        }));

        const { data: newItems } = await supabase.from("clothing_items").insert(rows).select();
        if (newItems) {
          const inserted = newItems as ClothingItem[];
          set((s) => ({ items: [...inserted, ...s.items] }));
          importedCount = inserted.length;

          // Generate individual cutouts asynchronously — crop each piece + remove bg
          for (const item of inserted) {
            try {
              const { base64 } = await callApi<{ base64: string }>("/api/segment-item", {
                photoUrl,
                category: item.tags.category,
                description: item.name ?? item.tags.category,
              });
              const cutoutUrl = await uploadBase64(base64, user.id);
              await supabase.from("clothing_items").update({ thumbnail_url: cutoutUrl }).eq("id", item.id);
              set((s) => ({
                items: s.items.map((i) => i.id === item.id ? { ...i, thumbnail_url: cutoutUrl } : i),
              }));
              await new Promise((r) => setTimeout(r, 800));
            } catch { /* skip — item still shows original photo */ }
          }
        }
      }

      return { photo, importedCount };
    } catch (err) {
      throw err;
    } finally {
      set({ uploading: false });
    }
  },

  deleteOutfitPhoto: async (id) => {
    const supabase = createClient();
    const photo = get().outfitPhotos.find((p) => p.id === id);
    if (!photo) return;

    const { error: itemsErr } = await supabase.from("clothing_items").delete().eq("outfit_photo_id", id);
    if (itemsErr) throw new Error(itemsErr.message);

    const { error: photoErr } = await supabase.from("outfit_photos").delete().eq("id", id);
    if (photoErr) throw new Error(photoErr.message);

    await deletePhoto(photo.photo_url);
    set((s) => ({
      outfitPhotos: s.outfitPhotos.filter((p) => p.id !== id),
      items: s.items.filter((i) => i.outfit_photo_id !== id),
    }));
  },

  saveOutfit: async ({ item_ids, occasion, reasoning, style_notes }) => {
    const supabase = createClient();
    const user = await getUserSafe(supabase);
    if (!user) return;
    const { data, error } = await supabase
      .from("saved_outfits")
      .insert({ user_id: user.id, item_ids, occasion, reasoning, style_notes })
      .select().single();
    if (error) throw new Error(error.message);
    set((s) => ({ savedOutfits: [data as SavedOutfit, ...s.savedOutfits] }));
  },

  removeSavedOutfit: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("saved_outfits").delete().eq("id", id);
    if (error) throw new Error(error.message);
    set((s) => ({ savedOutfits: s.savedOutfits.filter((o) => o.id !== id) }));
  },

  planOutfit: async (date, item_ids, occasion, notes) => {
    const supabase = createClient();
    const user = await getUserSafe(supabase);
    if (!user) return;
    const { data, error } = await supabase
      .from("planned_outfits")
      .upsert({ user_id: user.id, planned_date: date, item_ids, occasion, notes }, { onConflict: "user_id,planned_date" })
      .select().single();
    if (error) throw new Error(error.message);
    set((s) => ({
      plannedOutfits: [
        ...s.plannedOutfits.filter((p) => p.planned_date !== date),
        data as PlannedOutfit,
      ].sort((a, b) => a.planned_date.localeCompare(b.planned_date)),
    }));
  },

  removePlannedOutfit: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("planned_outfits").delete().eq("id", id);
    if (error) throw new Error(error.message);
    set((s) => ({ plannedOutfits: s.plannedOutfits.filter((p) => p.id !== id) }));
  },

  saveToWishlist: async (suggestion) => {
    const supabase = createClient();
    const user = await getUserSafe(supabase);
    if (!user) return;
    const { data, error } = await supabase
      .from("wishlist_items")
      .insert({
        user_id: user.id,
        item_name: suggestion.item_name,
        category: suggestion.category,
        colors: suggestion.colors,
        style: suggestion.style,
        reasoning: suggestion.reasoning,
        pairs_with_item_ids: suggestion.pairs_with.map((i) => i.id),
        image: suggestion.image,
        shop_url: suggestion.shop_url,
      })
      .select().single();
    if (error) throw new Error(error.message);
    set((s) => ({ wishlistItems: [data as WishlistItem, ...s.wishlistItems] }));
  },

  removeFromWishlist: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("wishlist_items").delete().eq("id", id);
    if (error) throw new Error(error.message);
    set((s) => ({ wishlistItems: s.wishlistItems.filter((w) => w.id !== id) }));
  },
}));
