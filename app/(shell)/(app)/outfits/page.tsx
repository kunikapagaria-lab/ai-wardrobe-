"use client";
import { useEffect, useState } from "react";
import { Shuffle, Sparkles, Bookmark } from "lucide-react";
import { useWardrobeStore } from "@/store/wardrobe";
import { OutfitCollageCard } from "@/components/outfits/OutfitCollageCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/lib/toast";
import { OCCASIONS, cn } from "@/lib/utils";
import type { OutfitRecommendation, MixMatchSuggestion, SavedOutfit, ClothingItem } from "@/types";

type Tab = "occasions" | "mix" | "saved";

function OutfitGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <Skeleton className="w-full rounded-none" style={{ aspectRatio: "1/1" }} />
          <div className="p-3 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OutfitsPage() {
  const { items, savedOutfits, fetchAll, saveOutfit, removeSavedOutfit } = useWardrobeStore();
  const [tab, setTab] = useState<Tab>("occasions");
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [outfits, setOutfits] = useState<OutfitRecommendation[]>([]);
  const [mixMatches, setMixMatches] = useState<MixMatchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const hydrate = (outfit: SavedOutfit): ClothingItem[] =>
    outfit.item_ids.map((id) => items.find((i) => i.id === id)).filter(Boolean) as ClothingItem[];

  const fetchOutfits = async (occasion: string) => {
    if (items.length === 0) return toast.error("Add items to your wardrobe first.");
    setSelectedOccasion(occasion);
    setLoading(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wardrobe: items, occasion, count: 4 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOutfits(data.outfits ?? []);
      setTab("occasions");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMixMatch = async () => {
    if (items.length < 2) return toast.error("Add at least 2 items to your wardrobe first.");
    setLoading(true);
    try {
      const res = await fetch("/api/mix-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wardrobe: items, count: 4 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMixMatches(data.suggestions ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mix & match failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (outfit: OutfitRecommendation) => {
    await saveOutfit({
      item_ids: outfit.items.map((i) => i.id),
      occasion: outfit.occasion,
      reasoning: outfit.reasoning,
      style_notes: outfit.style_notes,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Style AI</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Outfits built from your closet</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: "var(--border)" }}>
        {(["occasions", "mix", "saved"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === "mix" && mixMatches.length === 0) fetchMixMatch(); }}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === t ? "bg-white shadow-sm text-[var(--text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"
            )}
          >
            {t === "occasions" ? "Occasions" : t === "mix" ? "Mix & Match" : `Saved (${savedOutfits.length})`}
          </button>
        ))}
      </div>

      {/* Occasions */}
      {tab === "occasions" && (
        <div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-6">
            {OCCASIONS.map((occ) => (
              <button
                key={occ.key}
                onClick={() => fetchOutfits(occ.key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-colors",
                  selectedOccasion === occ.key
                    ? "border-[var(--primary)] bg-[var(--primary-light)]"
                    : "border-[var(--border)] bg-white hover:border-[var(--primary)]"
                )}
              >
                <occ.icon className="w-5 h-5" style={{ color: selectedOccasion === occ.key ? "var(--primary)" : "var(--text-muted)" }} />
                <span className="text-[11px] font-medium text-center" style={{ color: selectedOccasion === occ.key ? "var(--primary-dark)" : "var(--text-secondary)" }}>
                  {occ.label}
                </span>
              </button>
            ))}
          </div>

          {loading && <OutfitGridSkeleton />}

          {!loading && outfits.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {outfits.map((outfit) => (
                <OutfitCollageCard
                  key={outfit.id}
                  items={outfit.items}
                  occasion={outfit.occasion}
                  reasoning={outfit.reasoning}
                  styleNotes={outfit.style_notes}
                  onSave={() => handleSave(outfit)}
                />
              ))}
            </div>
          )}

          {!loading && !selectedOccasion && (
            <EmptyState icon={Sparkles} title="Pick an occasion above" description="AI will build outfits from your wardrobe" />
          )}
        </div>
      )}

      {/* Mix & Match */}
      {tab === "mix" && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>AI-curated unexpected pairings</p>
            <button
              onClick={fetchMixMatch}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors hover:bg-[var(--primary-light)]"
              style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              <Shuffle className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          {loading && <OutfitGridSkeleton />}

          {!loading && mixMatches.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {mixMatches.map((s) => (
                <OutfitCollageCard
                  key={s.id}
                  items={s.items}
                  headline={s.headline}
                  reasoning={s.reasoning}
                  onSave={() => saveOutfit({ item_ids: s.items.map((i) => i.id), occasion: "casual", reasoning: s.reasoning })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Saved */}
      {tab === "saved" && (
        <div>
          {savedOutfits.length === 0 ? (
            <EmptyState icon={Bookmark} title="No saved looks yet" description="Save outfits from the Occasions or Mix & Match tabs" />
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {savedOutfits.map((outfit) => {
                const hydratedItems = hydrate(outfit);
                return (
                  <OutfitCollageCard
                    key={outfit.id}
                    items={hydratedItems}
                    occasion={outfit.occasion}
                    reasoning={outfit.reasoning}
                    isSaved
                    onRemove={() => removeSavedOutfit(outfit.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
