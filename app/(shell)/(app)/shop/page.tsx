"use client";
import { useEffect, useState } from "react";
import { Shuffle, ShoppingBag, Bookmark } from "lucide-react";
import { useWardrobeStore } from "@/store/wardrobe";
import { ShoppingSuggestionCard } from "@/components/shop/ShoppingSuggestionCard";
import { ProductPickerDialog } from "@/components/shop/ProductPickerDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { ProductMatch } from "@/lib/serpapi";
import type { ShoppingSuggestion, ClothingItem } from "@/types";

type Tab = "suggestions" | "saved";
const MIN_ITEMS = 3;
const PREFERENCE_KEY = "wardrobeai-shop-style-preference";

function ShopGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border overflow-hidden p-4 space-y-2.5" style={{ borderColor: "var(--border)" }}>
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function ShopPage() {
  const { items, wishlistItems, fetchAll, saveToWishlist, removeFromWishlist } = useWardrobeStore();
  const [tab, setTab] = useState<Tab>("suggestions");
  const [suggestions, setSuggestions] = useState<ShoppingSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loadingImageIds, setLoadingImageIds] = useState<Set<string>>(new Set());
  const [stylePreference, setStylePreference] = useState("");
  const [browsingSuggestion, setBrowsingSuggestion] = useState<ShoppingSuggestion | null>(null);

  const fetchSuggestions = async (wardrobe: ClothingItem[] = items, preference: string = stylePreference) => {
    if (wardrobe.length < MIN_ITEMS) return;
    setLoading(true);
    try {
      const res = await fetch("/api/shop-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wardrobe, count: 4, stylePreference: preference }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const initial: ShoppingSuggestion[] = data.suggestions ?? [];
      setSuggestions(initial);
      setLoading(false);
      setFetched(true);
      setLoadingImageIds(new Set(initial.map((s) => s.id)));

      // Real product photos/links are slower (external lookups, can take up to
      // ~15s on a cache miss) — fetch them per-suggestion in the background so
      // the page never waits on them; each card upgrades in place as it resolves.
      initial.forEach((s) => {
        fetch("/api/shop-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemName: s.item_name, stylePreference: preference }),
        })
          .then((r) => r.json())
          .then((img: { image: string | null; shop_url: string | null }) => {
            setSuggestions((prev) =>
              prev.map((p) => (p.id === s.id ? { ...p, image: img.image ?? p.image, shop_url: img.shop_url ?? p.shop_url } : p))
            );
          })
          .catch(() => {})
          .finally(() => {
            setLoadingImageIds((prev) => {
              const next = new Set(prev);
              next.delete(s.id);
              return next;
            });
          });
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't get shopping suggestions");
      setLoading(false);
      setFetched(true);
    }
  };

  useEffect(() => {
    // Auto-fetch once, after the wardrobe has loaded — deferred behind the
    // fetchAll() promise so this stays outside the effect's synchronous body.
    const saved = localStorage.getItem(PREFERENCE_KEY) ?? "";
    fetchAll().then(() => {
      setStylePreference(saved);
      fetchSuggestions(useWardrobeStore.getState().items, saved);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePreferenceChange = (value: string) => {
    setStylePreference(value);
    localStorage.setItem(PREFERENCE_KEY, value);
  };

  const handleSave = async (suggestion: ShoppingSuggestion) => {
    try {
      await saveToWishlist(suggestion);
      setSavedIds((s) => new Set(s).add(suggestion.id));
      toast.success("Saved to wishlist");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save");
    }
  };

  const hydrateWishlistPairs = (ids: string[]): ClothingItem[] =>
    ids.map((id) => items.find((i) => i.id === id)).filter(Boolean) as ClothingItem[];

  const handleProductSelected = (product: ProductMatch) => {
    if (!browsingSuggestion) return;
    setSuggestions((prev) =>
      prev.map((p) => (p.id === browsingSuggestion.id ? { ...p, image: product.image, shop_url: product.shopUrl } : p))
    );
    setBrowsingSuggestion(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Shop</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>What to buy next, based on your style</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: "var(--border)" }}>
        {(["suggestions", "saved"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === t ? "bg-white shadow-sm text-[var(--text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"
            )}
          >
            {t === "suggestions" ? "Suggestions" : `Saved (${wishlistItems.length})`}
          </button>
        ))}
      </div>

      {/* Suggestions */}
      {tab === "suggestions" && (
        <div>
          {items.length < MIN_ITEMS ? (
            <EmptyState
              icon={ShoppingBag}
              title="Add a few more pieces first"
              description={`We need at least ${MIN_ITEMS} items in your wardrobe to find your style gaps`}
            />
          ) : (
            <>
              <div className="mb-4">
                <label htmlFor="style-preference" className="text-xs font-medium block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Your style &amp; fit (helps get suggestions that actually match you)
                </label>
                <div className="flex gap-2">
                  <input
                    id="style-preference"
                    value={stylePreference}
                    onChange={(e) => handlePreferenceChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") fetchSuggestions(); }}
                    placeholder="e.g. menswear, oversized fits, streetwear — or womenswear, fitted, minimalist"
                    className="flex-1 px-3 py-2 text-sm rounded-xl border outline-none focus:border-[var(--primary)]"
                    style={{ borderColor: "var(--border)", color: "var(--text)", background: "white" }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mb-5">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>AI-curated picks that complement what you own</p>
                <button
                  onClick={() => fetchSuggestions()}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors hover:bg-[var(--primary-light)]"
                  style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>

              {loading && <ShopGridSkeleton />}

              {!loading && suggestions.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {suggestions.map((s) => (
                    <ShoppingSuggestionCard
                      key={s.id}
                      itemName={s.item_name}
                      category={s.category}
                      colors={s.colors}
                      style={s.style}
                      reasoning={s.reasoning}
                      pairsWith={s.pairs_with}
                      image={s.image}
                      shopUrl={s.shop_url}
                      imageLoading={loadingImageIds.has(s.id)}
                      isSaved={savedIds.has(s.id)}
                      onSave={() => handleSave(s)}
                      onBrowseStyles={() => setBrowsingSuggestion(s)}
                    />
                  ))}
                </div>
              )}

              {!loading && fetched && suggestions.length === 0 && (
                <EmptyState icon={ShoppingBag} title="No suggestions yet" description="Try refreshing, or add a few more items to your wardrobe" />
              )}
            </>
          )}
        </div>
      )}

      {/* Saved */}
      {tab === "saved" && (
        <div>
          {wishlistItems.length === 0 ? (
            <EmptyState icon={Bookmark} title="Nothing saved yet" description="Save suggestions you like from the Suggestions tab" />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {wishlistItems.map((w) => (
                <ShoppingSuggestionCard
                  key={w.id}
                  itemName={w.item_name}
                  category={w.category}
                  colors={w.colors}
                  style={w.style}
                  reasoning={w.reasoning ?? ""}
                  pairsWith={hydrateWishlistPairs(w.pairs_with_item_ids)}
                  image={w.image}
                  shopUrl={w.shop_url}
                  isSaved
                  onRemove={() => removeFromWishlist(w.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {browsingSuggestion && (
        <ProductPickerDialog
          open
          onClose={() => setBrowsingSuggestion(null)}
          initialQuery={browsingSuggestion.item_name}
          onSelect={handleProductSelected}
        />
      )}
    </div>
  );
}
