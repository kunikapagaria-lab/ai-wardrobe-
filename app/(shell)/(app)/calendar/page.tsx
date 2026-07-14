"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";
import { useWardrobeStore } from "@/store/wardrobe";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { StyleWithAIDialog } from "@/components/calendar/StyleWithAIDialog";
import { confirm } from "@/lib/confirm";
import { toast } from "@/lib/toast";
import type { ClothingItem } from "@/types";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

export default function CalendarPage() {
  const { items, plannedOutfits, loading, fetchAll, planOutfit, removePlannedOutfit } = useWardrobeStore();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [pickingItems, setPickingItems] = useState(false);
  const [showStyleDialog, setShowStyleDialog] = useState(false);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const dateKey = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const plannedMap = new Map(plannedOutfits.map((p) => [p.planned_date, p]));

  const selectedPlan = selectedDate ? plannedMap.get(selectedDate) : null;
  const selectedItems = selectedPlan
    ? selectedPlan.item_ids.map((id) => items.find((i) => i.id === id)).filter(Boolean) as ClothingItem[]
    : [];

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const handleAddItem = async (item: ClothingItem) => {
    if (!selectedDate) return;
    const currentIds = selectedPlan?.item_ids ?? [];
    if (currentIds.includes(item.id)) return;
    await planOutfit(selectedDate, [...currentIds, item.id]);
    setPickingItems(false);
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!selectedDate || !selectedPlan) return;
    const newIds = selectedPlan.item_ids.filter((id) => id !== itemId);
    if (newIds.length === 0) await removePlannedOutfit(selectedPlan.id);
    else await planOutfit(selectedDate, newIds);
  };

  const handleAIStyleSelect = async (occasion: string, itemIds: string[]) => {
    if (!selectedDate) return;
    if (selectedItems.length > 0) {
      const ok = await confirm({
        title: "Replace this day's outfit?",
        description: "This swaps out what's currently planned for this day with the AI-picked look.",
        confirmLabel: "Replace",
      });
      if (!ok) return;
    }
    await planOutfit(selectedDate, itemIds, occasion);
    setShowStyleDialog(false);
    toast.success("Outfit planned");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Calendar</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Plan your outfits ahead</p>
      </div>

      {loading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
      <>
      {/* Calendar */}
      <div className="card bg-white rounded-2xl border p-5 mb-5" style={{ borderColor: "var(--border)" }}>
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} aria-label="Previous month" className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronLeft className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
          <h2 className="font-semibold" style={{ color: "var(--text)" }}>{MONTH_NAMES[month]} {year}</h2>
          <button onClick={nextMonth} aria-label="Next month" className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronRight className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-xs font-medium py-1" style={{ color: "var(--text-muted)" }}>{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const key = dateKey(d);
            const hasPlan = plannedMap.has(key);
            const isToday = year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
            const isSelected = selectedDate === key;

            return (
              <button
                key={d}
                onClick={() => setSelectedDate(isSelected ? null : key)}
                aria-label={`${MONTH_NAMES[month]} ${d}, ${year}${hasPlan ? " — outfit planned" : ""}`}
                aria-pressed={isSelected}
                className={cn(
                  "relative aspect-square rounded-xl flex flex-col items-center justify-start pt-1.5 transition-colors text-sm font-medium",
                  isSelected ? "bg-[var(--primary)] text-white" :
                  isToday ? "bg-[var(--primary-light)] text-[var(--primary-dark)]" :
                  "hover:bg-gray-50 text-[var(--text)]"
                )}
              >
                {d}
                {hasPlan && (
                  <div className={cn("w-1 h-1 rounded-full mt-0.5", isSelected ? "bg-white" : "bg-[var(--primary)]")} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date panel */}
      {selectedDate && (
        <div className="card bg-white rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: "var(--text)" }}>
              {new Date(selectedDate + "T00:00:00").toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            <button onClick={() => setSelectedDate(null)} aria-label="Close" className="p-1 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            </button>
          </div>

          {/* Planned items */}
          {selectedItems.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedItems.map((item) => (
                <div key={item.id} className="relative w-16 group">
                  <div className="relative rounded-xl border overflow-hidden bg-[var(--background)]" style={{ aspectRatio: "1/1.2", borderColor: "var(--border)" }}>
                    <Image src={item.thumbnail_url ?? item.photo_url} alt={item.name ?? ""} fill className="object-contain p-1" sizes="64px" />
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label={`Remove ${item.name ?? item.tags.category} from this day`}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[9px] text-center mt-0.5 truncate capitalize" style={{ color: "var(--text-muted)" }}>
                    {item.name ?? item.tags.category}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>No outfit planned</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setPickingItems(!pickingItems)}
              className="text-sm font-medium px-4 py-2 rounded-xl border transition-colors hover:bg-[var(--primary-light)]"
              style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              + Add item
            </button>
            <button
              onClick={() => setShowStyleDialog(true)}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl text-white"
              style={{ background: "var(--primary)" }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Style with AI
            </button>
          </div>

          {/* Item picker */}
          {pickingItems && (
            <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Pick from wardrobe</p>
              <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleAddItem(item)}
                    aria-label={`Add ${item.name ?? item.tags.category} to this day`}
                    className="relative rounded-lg border overflow-hidden bg-white hover:border-[var(--primary)] transition-colors"
                    style={{ aspectRatio: "1/1.2", borderColor: "var(--border)" }}
                  >
                    <Image src={item.thumbnail_url ?? item.photo_url} alt="" fill className="object-contain p-0.5" sizes="60px" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      </>
      )}

      {selectedDate && (
        <StyleWithAIDialog
          open={showStyleDialog}
          onClose={() => setShowStyleDialog(false)}
          items={items}
          dateLabel={new Date(selectedDate + "T00:00:00").toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
          onSelect={handleAIStyleSelect}
        />
      )}
    </div>
  );
}
