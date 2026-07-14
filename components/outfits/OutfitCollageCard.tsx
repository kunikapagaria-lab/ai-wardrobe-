"use client";
import Image from "next/image";
import { Bookmark, BookmarkCheck, type LucideIcon } from "lucide-react";
import type { ClothingItem } from "@/types";

interface Props {
  items: ClothingItem[];
  occasion?: string;
  reasoning?: string;
  styleNotes?: string;
  headline?: string;
  isSaved?: boolean;
  onSave?: () => void;
  onRemove?: () => void;
  saveLabel?: string;
  saveIcon?: LucideIcon;
}

export function OutfitCollageCard({ items, occasion, reasoning, styleNotes, headline, isSaved, onSave, onRemove, saveLabel = "Save look", saveIcon: SaveIcon = Bookmark }: Props) {
  const display = items.slice(0, 6);

  return (
    <div className="card card-interactive bg-white rounded-2xl border overflow-hidden flex flex-col" style={{ borderColor: "var(--border)" }}>
      {/* Mini flat-lay grid */}
      <div className="grid grid-cols-3 gap-0.5 p-1.5" style={{ background: "var(--background)" }}>
        {display.map((item) => (
          <div key={item.id} className="relative bg-white rounded-lg overflow-hidden" style={{ aspectRatio: "1/1.2" }}>
            <Image
              src={item.thumbnail_url ?? item.photo_url}
              alt={item.name ?? item.tags.category}
              fill
              sizes="120px"
              className="object-contain p-1"
            />
          </div>
        ))}
        {/* Fill empty slots to keep grid shape */}
        {Array.from({ length: Math.max(0, 3 - (display.length % 3 === 0 ? 0 : 3 - display.length % 3)) }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white rounded-lg" style={{ aspectRatio: "1/1.2" }} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2.5 flex-1 flex flex-col gap-1.5">
        {occasion && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit capitalize"
            style={{ background: "var(--primary-light)", color: "var(--primary-dark)" }}>
            {occasion}
          </span>
        )}
        {headline && <p className="text-xs font-bold leading-tight" style={{ color: "var(--text)" }}>{headline}</p>}
        {reasoning && <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>{reasoning}</p>}
        {styleNotes && <p className="text-[10px] italic" style={{ color: "var(--text-muted)" }}>{styleNotes}</p>}

        {(onSave || onRemove) && (
          <div className="mt-1 pt-1.5 border-t" style={{ borderColor: "var(--border)" }}>
            {isSaved ? (
              <button onClick={onRemove} className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "var(--danger)" }}>
                <BookmarkCheck className="w-3.5 h-3.5" />
                Remove
              </button>
            ) : (
              <button onClick={onSave} className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "var(--primary)" }}>
                <SaveIcon className="w-3.5 h-3.5" />
                {saveLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
