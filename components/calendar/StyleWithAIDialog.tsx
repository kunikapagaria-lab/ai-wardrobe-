"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Sparkles, CalendarCheck } from "lucide-react";
import { OutfitCollageCard } from "@/components/outfits/OutfitCollageCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "@/lib/toast";
import { OCCASIONS } from "@/lib/utils";
import type { ClothingItem, OutfitRecommendation } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  items: ClothingItem[];
  dateLabel: string;
  onSelect: (occasion: string, itemIds: string[]) => void;
}

function ResultsSkeleton() {
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

export function StyleWithAIDialog({ open, onClose, items, dateLabel, onSelect }: Props) {
  const [occasion, setOccasion] = useState<string | null>(null);
  const [outfits, setOutfits] = useState<OutfitRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setOccasion(null);
    setOutfits([]);
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickOccasion = async (occ: string) => {
    if (items.length < 2) {
      toast.error("Add at least 2 items to your wardrobe first");
      return;
    }
    setOccasion(occ);
    setLoading(true);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wardrobe: items, occasion: occ, count: 4 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOutfits(data.outfits ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't generate outfits");
    } finally {
      setLoading(false);
    }
  };

  const handleUseLook = (outfit: OutfitRecommendation) => {
    onSelect(outfit.occasion, outfit.items.map((i) => i.id));
    reset();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl w-[calc(100%-2rem)] max-w-2xl shadow-xl max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10" style={{ borderColor: "var(--border)" }}>
            <div>
              <Dialog.Title className="font-semibold flex items-center gap-1.5" style={{ color: "var(--text)" }}>
                <Sparkles className="w-4 h-4" style={{ color: "var(--primary)" }} />
                Style with AI
              </Dialog.Title>
              <Dialog.Description className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{dateLabel}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button aria-label="Close" className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6">
            {!occasion ? (
              <>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>What&apos;s the occasion?</p>
                <div className="grid grid-cols-4 gap-2">
                  {OCCASIONS.map((occ) => (
                    <button
                      key={occ.key}
                      onClick={() => pickOccasion(occ.key)}
                      className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-colors border-[var(--border)] bg-white hover:border-[var(--primary)]"
                    >
                      <occ.icon className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                      <span className="text-[11px] font-medium text-center" style={{ color: "var(--text-secondary)" }}>
                        {occ.label}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Outfits for <span className="capitalize font-medium">{occasion}</span>
                  </p>
                  <button
                    onClick={reset}
                    className="text-xs font-medium"
                    style={{ color: "var(--primary)" }}
                  >
                    Change occasion
                  </button>
                </div>

                {loading && <ResultsSkeleton />}

                {!loading && outfits.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {outfits.map((outfit) => (
                      <OutfitCollageCard
                        key={outfit.id}
                        items={outfit.items}
                        occasion={outfit.occasion}
                        reasoning={outfit.reasoning}
                        styleNotes={outfit.style_notes}
                        saveLabel="Use this look"
                        saveIcon={CalendarCheck}
                        onSave={() => handleUseLook(outfit)}
                      />
                    ))}
                  </div>
                )}

                {!loading && outfits.length === 0 && (
                  <EmptyState icon={Sparkles} title="No outfits found" description="Try a different occasion, or add more items to your wardrobe" />
                )}
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
