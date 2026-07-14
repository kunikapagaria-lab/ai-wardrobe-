"use client";
import { useState } from "react";
import Image from "next/image";
import { Bookmark, BookmarkCheck, ExternalLink, Loader2, Images } from "lucide-react";
import { resolveColor, hexToRgba } from "@/lib/colors";
import { CATEGORY_LABELS, CATEGORY_ICONS } from "@/lib/utils";
import type { ClothingCategory, ClothingItem, ClothingStyle } from "@/types";

interface Props {
  itemName: string;
  category: ClothingCategory;
  colors: string[];
  style: ClothingStyle[];
  reasoning: string;
  pairsWith: ClothingItem[];
  image: string | null;
  shopUrl: string;
  imageLoading?: boolean;
  isSaved?: boolean;
  onSave?: () => void;
  onRemove?: () => void;
  onBrowseStyles?: () => void;
}

export function ShoppingSuggestionCard({ itemName, category, colors, style, reasoning, pairsWith, image, shopUrl, imageLoading, isSaved, onSave, onRemove, onBrowseStyles }: Props) {
  const [imgError, setImgError] = useState(false);
  const primaryColor = resolveColor(colors[0] ?? "").hex;
  const Icon = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.other;

  return (
    <div className="card bg-white rounded-2xl border overflow-hidden flex flex-col" style={{ borderColor: "var(--border)" }}>
      {/* Real product photo when we found one; otherwise a category-tinted icon. Both link out to Shop. */}
      <div className="relative">
        <a href={shopUrl} target="_blank" rel="noopener noreferrer" className="block">
          {image && !imgError ? (
            <div className="h-36 w-full flex items-center justify-center" style={{ background: "var(--background)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- external retailer CDN, arbitrary hosts */}
              <img
                src={image}
                alt={itemName}
                className="h-full w-full object-contain"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div className="relative h-36 flex items-center justify-center" style={{ background: hexToRgba(primaryColor, 0.14) }}>
              <Icon className="w-9 h-9" style={{ color: primaryColor }} />
              {imageLoading && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-white/80">
                  <Loader2 className="w-3 h-3 animate-spin" style={{ color: primaryColor }} />
                  <span className="text-[9px] font-medium" style={{ color: "var(--text-secondary)" }}>Finding photo…</span>
                </div>
              )}
            </div>
          )}
        </a>
        {onBrowseStyles && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBrowseStyles(); }}
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 shadow-sm text-[10px] font-medium hover:bg-white transition-colors"
            style={{ color: "var(--text)" }}
          >
            <Images className="w-3 h-3" />
            Browse styles
          </button>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2.5">
        {/* Category + color swatches */}
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit capitalize"
            style={{ background: "var(--primary-light)", color: "var(--primary-dark)" }}
          >
            {CATEGORY_LABELS[category] ?? category}
          </span>
          <div className="flex items-center gap-1">
            {colors.slice(0, 4).map((c, i) => (
              <span
                key={i}
                className="w-3.5 h-3.5 rounded-full border"
                style={{ background: resolveColor(c).hex, borderColor: "var(--border)" }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Name */}
        <p className="text-sm font-bold capitalize leading-snug" style={{ color: "var(--text)" }}>{itemName}</p>

        {/* Style tags */}
        {style.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {style.map((s, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--background)] font-medium capitalize" style={{ color: "var(--text-secondary)" }}>
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Reasoning */}
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{reasoning}</p>

        {/* Pairs with */}
        {pairsWith.length > 0 && (
          <div className="pt-1">
            <p className="text-[10px] font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              Pairs with {pairsWith.length} item{pairsWith.length !== 1 ? "s" : ""} you own
            </p>
            <div className="flex gap-1.5">
              {pairsWith.slice(0, 4).map((item) => (
                <div key={item.id} className="relative w-10 h-12 rounded-lg border overflow-hidden bg-[var(--background)] shrink-0" style={{ borderColor: "var(--border)" }}>
                  <Image src={item.thumbnail_url ?? item.photo_url} alt={item.name ?? item.tags.category} fill className="object-contain p-0.5" sizes="40px" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-2.5 border-t flex items-center justify-between gap-2" style={{ borderColor: "var(--border)" }}>
        {isSaved && onRemove ? (
          <button onClick={onRemove} className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "var(--danger)" }}>
            <BookmarkCheck className="w-3.5 h-3.5" />
            Remove
          </button>
        ) : isSaved ? (
          <span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
            <BookmarkCheck className="w-3.5 h-3.5" />
            Saved to wishlist
          </span>
        ) : onSave ? (
          <button onClick={onSave} className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: "var(--primary)" }}>
            <Bookmark className="w-3.5 h-3.5" />
            Save to wishlist
          </button>
        ) : <span />}

        <a
          href={shopUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[11px] font-medium shrink-0"
          style={{ color: "var(--text-secondary)" }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Shop
        </a>
      </div>
    </div>
  );
}
