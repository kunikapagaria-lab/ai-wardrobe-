"use client";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Heart, Trash2, Loader2, Shirt } from "lucide-react";
import { useState } from "react";
import { CATEGORY_LABELS } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { confirm } from "@/lib/confirm";
import type { ClothingItem, ClothingCategory } from "@/types";

interface Props {
  item: ClothingItem;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Pick<ClothingItem, "name" | "notes" | "is_favorite" | "tags">>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLogWear: (id: string) => Promise<void>;
  onToggleFavorite: (id: string) => Promise<void>;
}

export function ItemDetail({ item, onClose, onUpdate, onDelete, onLogWear, onToggleFavorite }: Props) {
  const [name, setName] = useState(item.name ?? "");
  const [notes, setNotes] = useState(item.notes ?? "");
  const [category, setCategory] = useState(item.tags.category);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [daysSinceWorn, setDaysSinceWorn] = useState<number | null>(() =>
    item.last_worn_at ? Math.floor((Date.now() - new Date(item.last_worn_at).getTime()) / 86400000) : null
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(item.id, {
        name: name || undefined,
        notes: notes || undefined,
        tags: { ...item.tags, category },
      });
    }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const ok = await confirm({ title: "Delete this item?", description: "This removes it from your wardrobe permanently.", confirmLabel: "Delete", danger: true });
    if (!ok) return;
    setDeleting(true);
    try { await onDelete(item.id); onClose(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Delete failed"); setDeleting(false); }
  };

  const activeUrl = item.thumbnail_url ?? item.photo_url;
  const label = item.name || CATEGORY_LABELS[item.tags.category] || item.tags.category;

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl w-[calc(100%-2rem)] max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10" style={{ borderColor: "var(--border)" }}>
          <Dialog.Title className="font-semibold capitalize" style={{ color: "var(--text)" }}>{label}</Dialog.Title>
          <Dialog.Description className="sr-only">Item details, tags, and wear history for {label}</Dialog.Description>
          <Dialog.Close asChild>
            <button aria-label="Close" className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            </button>
          </Dialog.Close>
        </div>

        {/* Image */}
        <div className="relative h-72 bg-[var(--background)] overflow-hidden">
          <Image src={activeUrl} alt={label} fill className="object-contain p-4" />
          
          <button
            onClick={() => onToggleFavorite(item.id)}
            aria-label={item.is_favorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={item.is_favorite}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white z-10"
          >
            <Heart className={item.is_favorite ? "w-4 h-4 fill-red-500 text-red-500" : "w-4 h-4 text-gray-400"} />
          </button>
        </div>

        {/* Tags */}
        <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-wrap gap-1.5">
            {[CATEGORY_LABELS[item.tags.category], ...item.tags.colors, ...item.tags.style, ...item.tags.occasion].map((tag, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-[var(--background)] font-medium capitalize" style={{ color: "var(--text-secondary)" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="text-center p-3 rounded-xl" style={{ background: "var(--background)" }}>
            <p className="text-xl font-bold" style={{ color: "var(--primary)" }}>{item.wear_count ?? 0}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Times worn</p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ background: "var(--background)" }}>
            <p className="text-xl font-bold" style={{ color: "var(--primary)" }}>
              {daysSinceWorn !== null ? `${daysSinceWorn}d` : "—"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Days since worn</p>
          </div>
        </div>

        {/* Edit form */}
        <div className="px-6 py-4 space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-secondary)" }}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-[var(--primary)]"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
              placeholder="e.g. White linen shirt"
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-secondary)" }}>Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ClothingCategory)}
              className="w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-[var(--primary)] bg-white"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-secondary)" }}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-xl border outline-none focus:border-[var(--primary)] resize-none"
              style={{ borderColor: "var(--border)", color: "var(--text)" }}
              placeholder="Styling notes, fit..."
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { onLogWear(item.id); setDaysSinceWorn(0); }}
              className="flex-1 py-2 rounded-xl text-sm font-medium border transition-colors hover:bg-[var(--primary-light)]"
              style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              <Shirt className="w-3.5 h-3.5 inline mr-1.5" />
              Log worn today
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-1.5"
              style={{ background: "var(--primary)" }}
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save
            </button>
          </div>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors hover:bg-red-50"
            style={{ color: "var(--danger)" }}
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Delete from wardrobe
          </button>
        </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
