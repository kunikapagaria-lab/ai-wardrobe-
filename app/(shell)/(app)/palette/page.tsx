"use client";
import { useEffect, useMemo } from "react";
import { Palette } from "lucide-react";
import { useWardrobeStore } from "@/store/wardrobe";
import { computePaletteInsights } from "@/lib/palette";
import { SwatchCloud } from "@/components/palette/SwatchCloud";
import { FamilyDistributionBar } from "@/components/palette/FamilyDistributionBar";
import { CategoryColorGrid } from "@/components/palette/CategoryColorGrid";
import { GapInsights } from "@/components/palette/GapInsights";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export default function PalettePage() {
  const { items, loading, fetchAll } = useWardrobeStore();
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const insights = useMemo(() => computePaletteInsights(items), [items]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Palette</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>The color story of your wardrobe</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Palette} title="Nothing to read yet" description="Add a few pieces to your wardrobe to see your color palette" />
      ) : (
        <div className="space-y-5">
          {/* Swatch cloud */}
          <div className="card bg-white rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold mb-4" style={{ color: "var(--text)" }}>Every color in your closet</h2>
            <SwatchCloud swatches={insights.swatches} />
          </div>

          {/* Family distribution */}
          <div className="card bg-white rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold mb-4" style={{ color: "var(--text)" }}>Palette balance</h2>
            <FamilyDistributionBar familyCounts={insights.familyCounts} total={insights.totalMentions} />
          </div>

          {/* Category x family coverage */}
          <div className="card bg-white rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold mb-1" style={{ color: "var(--text)" }}>Coverage by category</h2>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>Dashed cells mark a color family missing from that category</p>
            <CategoryColorGrid categories={insights.categories} matrix={insights.categoryMatrix} />
          </div>

          {/* Gap insights */}
          <div className="card bg-white rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold mb-4" style={{ color: "var(--text)" }}>Suggestions</h2>
            <GapInsights gaps={insights.gaps} />
          </div>
        </div>
      )}
    </div>
  );
}
