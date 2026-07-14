"use client";
import Image from "next/image";
import { Heart, Trash2 } from "lucide-react";
import { cn, CATEGORY_LABELS } from "@/lib/utils";
import type { ClothingItem } from "@/types";

interface Props {
  item: ClothingItem;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (item: ClothingItem) => void;
}

export function ItemCard({ item, onToggleFavorite, onDelete, onClick }: Props) {
  const displayUrl = item.thumbnail_url ?? item.photo_url;
  const label = item.name || CATEGORY_LABELS[item.tags.category] || item.tags.category;

  return (
    <div
      className="card card-interactive group relative bg-white rounded-xl border cursor-pointer overflow-hidden"
      style={{ borderColor: "var(--border)", aspectRatio: "5/7" }}
      onClick={() => onClick(item)}
    >
      {/* Item image */}
      <div className="absolute inset-0 p-2">
        <Image
          src={displayUrl}
          alt={label}
          fill
          sizes="(max-width: 640px) 25vw, (max-width: 1024px) 20vw, 15vw"
          className="object-contain"
          style={{ padding: "6px" }}
        />
      </div>

      {/* Hover overlay with actions */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

      {/* Favorite button — always tappable on touch, hover-revealed on desktop */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
        aria-label={item.is_favorite ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={item.is_favorite}
        className={cn(
          "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all",
          item.is_favorite
            ? "bg-white shadow-sm"
            : "bg-black/20 opacity-70 md:opacity-0 md:group-hover:opacity-100"
        )}
      >
        <Heart className={cn("w-3.5 h-3.5", item.is_favorite ? "fill-red-500 text-red-500" : "text-white")} />
      </button>

      {/* Delete button — always tappable on touch, hover-revealed on desktop */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
        aria-label="Delete item"
        className="absolute top-2 left-2 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-red-500"
      >
        <Trash2 className="w-3 h-3" />
      </button>

      {/* "from look" badge */}
      {item.outfit_photo_id && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-white/90 border" style={{ color: "var(--primary)", borderColor: "var(--primary-light)" }}>
            from look
          </span>
        </div>
      )}

      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-white border-t" style={{ borderColor: "var(--border)" }}>
        <p className="text-[10px] font-semibold truncate capitalize" style={{ color: "var(--text)" }}>{label}</p>
        <p className="text-[9px] truncate" style={{ color: "var(--text-muted)" }}>{item.tags.colors.slice(0, 2).join(" · ")}</p>
      </div>
    </div>
  );
}
