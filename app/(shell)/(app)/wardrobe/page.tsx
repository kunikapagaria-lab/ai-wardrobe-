"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Search, Wand2, Loader2, Trash2, X, ImageOff, Heart, Shirt, Images } from "lucide-react";
import { toast } from "@/lib/toast";
import { confirm } from "@/lib/confirm";
import { WardrobeGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { OutfitPhoto } from "@/types"; // used by LookCard below

function LookCard({ photo, onDelete }: { photo: OutfitPhoto; onDelete: (id: string) => void }) {
  const [imgError, setImgError] = useState(false);
  const hasUrl = !!photo.photo_url;

  return (
    <div className="card card-interactive group relative rounded-xl overflow-hidden border bg-white" style={{ borderColor: "var(--border)", aspectRatio: "3/4" }}>
      {hasUrl && !imgError ? (
        <Image
          src={photo.photo_url}
          alt="Look"
          fill
          className="object-cover"
          sizes="200px"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: "var(--background)" }}>
          <ImageOff className="w-6 h-6" style={{ color: "var(--text-muted)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>No image</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
      <button
        onClick={() => onDelete(photo.id)}
        aria-label="Delete look"
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-all hover:bg-red-500 group/btn"
      >
        <Trash2 className="w-3 h-3 text-red-500 group-hover/btn:text-white" />
      </button>
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
        <p className="text-white text-[10px] font-medium">
          {new Date(photo.worn_at).toLocaleDateString("en", { month: "short", day: "numeric" })}
        </p>
      </div>
    </div>
  );
}
import { useWardrobeStore } from "@/store/wardrobe";
import { ItemCard } from "@/components/wardrobe/ItemCard";
import { ItemDetail } from "@/components/wardrobe/ItemDetail";
import { UploadModal } from "@/components/wardrobe/UploadModal";
import { WARDROBE_FILTERS, cn } from "@/lib/utils";

type Tab = "pieces" | "looks";

export default function WardrobePage() {
  const {
    items, outfitPhotos, loading, fetchAll,
    addItem, addOutfitPhoto, deleteItem, deleteOutfitPhoto,
    updateItem, toggleFavorite, logWear, generateCutouts,
  } = useWardrobeStore();

  const [tab, setTab] = useState<Tab>("pieces");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const selectedItem = items.find((i) => i.id === selectedItemId) || null;
  const [generatingCutouts, setGeneratingCutouts] = useState(false);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const missingCutouts = items.filter((i) => !i.thumbnail_url).length;

  const displayed = items.filter((item) => {
    if (favOnly && !item.is_favorite) return false;
    if (filter !== "all" && item.tags.category !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        (item.name?.toLowerCase().includes(q)) ||
        item.tags.colors.some((c) => c.toLowerCase().includes(q)) ||
        item.tags.category.includes(q) ||
        item.tags.style.some((s) => s.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleUpload = async (file: File, mode: "item" | "outfit") => {
    if (mode === "item") await addItem(file);
    else await addOutfitPhoto(file);
  };

  const handleGenerateCutouts = async () => {
    setGeneratingCutouts(true);
    try {
      const count = await generateCutouts();
      toast.success(`Generated cutouts for ${count} item${count !== 1 ? "s" : ""}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate cutouts");
    } finally {
      setGeneratingCutouts(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const ok = await confirm({ title: "Delete this item?", description: "This removes it from your wardrobe permanently.", confirmLabel: "Delete", danger: true });
    if (!ok) return;
    try { await deleteItem(id); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Delete failed"); }
  };

  const handleDeleteLook = async (id: string) => {
    const ok = await confirm({ title: "Remove this look?", description: "This also removes all pieces detected from it.", confirmLabel: "Remove", danger: true });
    if (!ok) return;
    try { await deleteOutfitPhoto(id); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Delete failed"); }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="skeleton h-7 w-32 rounded-lg mb-2" />
            <div className="skeleton h-4 w-24 rounded-lg" />
          </div>
          <div className="skeleton h-9 w-24 rounded-xl" />
        </div>
        <WardrobeGridSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Wardrobe</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{items.length} pieces · {outfitPhotos.length} looks</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "var(--primary)" }}
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit" style={{ background: "var(--border)" }}>
        {(["pieces", "looks"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize",
              tab === t ? "bg-white shadow-sm text-[var(--text)]" : "text-[var(--text-muted)] hover:text-[var(--text)]"
            )}
          >
            {t} {t === "pieces" ? `(${items.length})` : `(${outfitPhotos.length})`}
          </button>
        ))}
      </div>

      {/* Pieces tab */}
      {tab === "pieces" && (
        <div>
          {/* Generate cutouts banner */}
          {missingCutouts > 0 && (
            <button
              onClick={handleGenerateCutouts}
              disabled={generatingCutouts}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-4 border text-left transition-colors hover:bg-[var(--primary-light)]"
              style={{ borderColor: "var(--primary)", background: "var(--primary-light)" }}
            >
              {generatingCutouts ? <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: "var(--primary)" }} /> : <Wand2 className="w-4 h-4 shrink-0" style={{ color: "var(--primary)" }} />}
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--primary-dark)" }}>
                  {generatingCutouts ? "Generating cutouts…" : `Generate cutouts for ${missingCutouts} item${missingCutouts !== 1 ? "s" : ""}`}
                </p>
                <p className="text-xs" style={{ color: "var(--primary)" }}>Remove backgrounds for clean product-style display</p>
              </div>
            </button>
          )}

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search wardrobe…"
              aria-label="Search wardrobe"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:border-[var(--primary)]"
              style={{ borderColor: "var(--border)", color: "var(--text)", background: "white" }}
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {WARDROBE_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0",
                  filter === f.key
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "bg-white text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
                )}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={() => setFavOnly(!favOnly)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0",
                favOnly
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white text-[var(--text-secondary)] border-[var(--border)]"
              )}
            >
              <Heart className={cn("w-3 h-3", favOnly && "fill-white")} />
              Favorites
            </button>
          </div>

          {/* Grid */}
          {displayed.length === 0 ? (
            <EmptyState
              icon={Shirt}
              title={items.length === 0 ? "Your wardrobe is empty" : "No items match"}
              description={items.length === 0 ? 'Click "Add" to upload your first item' : "Try a different filter"}
            />
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2.5">
              {displayed.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onToggleFavorite={toggleFavorite}
                  onDelete={handleDeleteItem}
                  onClick={(item) => setSelectedItemId(item.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Looks tab */}
      {tab === "looks" && (
        <div>
          {outfitPhotos.length === 0 ? (
            <EmptyState
              icon={Images}
              title="No looks yet"
              description="Upload a full outfit photo — AI detects every piece"
            />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {outfitPhotos.map((photo) => (
                <LookCard
                  key={photo.id}
                  photo={photo}
                  onDelete={handleDeleteLook}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUpload={handleUpload} />
      )}
      {selectedItem && (
        <ItemDetail
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
          onUpdate={updateItem}
          onDelete={async (id) => { await deleteItem(id); setSelectedItemId(null); }}
          onLogWear={logWear}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
}
