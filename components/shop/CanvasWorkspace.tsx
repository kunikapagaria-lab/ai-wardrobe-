"use client";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, Plus, RefreshCw, Search, Loader2, Bookmark } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useWardrobeStore } from "@/store/wardrobe";
import type { ProductMatch } from "@/lib/serpapi";
import type { ShoppingSuggestion } from "@/types";

export interface CanvasItem extends ProductMatch {
  id: string;
  x: number;
  y: number;
}

const ITEM_SIZE = 130;
const COLUMNS = 3;
const GENDER_KEY = "wardrobeai-canvas-gender";
export const PENDING_LOOK_KEY = "wardrobeai-pending-look";
type Gender = "any" | "women" | "men";

function nextPosition(index: number) {
  return {
    x: 16 + (index % COLUMNS) * (ITEM_SIZE + 16),
    y: 16 + Math.floor(index / COLUMNS) * (ITEM_SIZE + 16),
  };
}

interface Props {
  items: CanvasItem[];
  onItemsChange: (items: CanvasItem[]) => void;
  height?: number;
  isLoggedIn: boolean;
}

export function CanvasWorkspace({ items, onItemsChange, height = 460, isLoggedIn }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const saveToWishlist = useWardrobeStore((s) => s.saveToWishlist);

  // Search state
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState<Gender>(() =>
    typeof window === "undefined" ? "any" : ((localStorage.getItem(GENDER_KEY) as Gender) ?? "any")
  );
  const [results, setResults] = useState<ProductMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleGenderChange = (g: Gender) => {
    setGender(g);
    localStorage.setItem(GENDER_KEY, g);
  };

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const genderedQuery = gender === "any" ? query.trim() : `${query.trim()} ${gender}`;
      const res = await fetch("/api/shop-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: genderedQuery }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.results ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Search failed";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleSaveLook = async () => {
    if (items.length === 0) return;
    if (!isLoggedIn) {
      localStorage.setItem(PENDING_LOOK_KEY, JSON.stringify(items));
      toast.show("Sign in to save this look — we'll keep it for you");
      router.push("/login");
      return;
    }
    setSaving(true);
    try {
      for (const item of items) {
        const suggestion: ShoppingSuggestion = {
          id: crypto.randomUUID(),
          item_name: item.title ?? "Item",
          category: "other",
          colors: [],
          style: [],
          reasoning: "Hand-picked in the Canvas",
          pairs_with: [],
          image: item.image,
          shop_url: item.shopUrl,
        };
        await saveToWishlist(suggestion);
      }
      toast.success(`Saved ${items.length} item${items.length !== 1 ? "s" : ""} to your wishlist`);
      onItemsChange([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save look");
    } finally {
      setSaving(false);
    }
  };

  const addItemAt = (product: ProductMatch, x: number, y: number) => {
    const maxX = Math.max(0, (canvasRef.current?.clientWidth ?? 600) - ITEM_SIZE);
    const maxY = Math.max(0, height - ITEM_SIZE);
    onItemsChange([
      ...items,
      { ...product, id: crypto.randomUUID(), x: Math.min(Math.max(0, x), maxX), y: Math.min(Math.max(0, y), maxY) },
    ]);
  };

  const addItemDefault = (product: ProductMatch) => {
    const pos = nextPosition(items.length);
    addItemAt(product, pos.x, pos.y);
  };

  const handleMove = (id: string, x: number, y: number) => {
    onItemsChange(items.map((i) => (i.id === id ? { ...i, x, y } : i)));
  };

  const handleRemove = (id: string) => {
    onItemsChange(items.filter((i) => i.id !== id));
  };

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {/* Canvas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {items.length === 0 ? "Nothing on the canvas yet" : `${items.length} item${items.length !== 1 ? "s" : ""} — drag to arrange`}
          </p>
          {items.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveLook}
                disabled={saving}
                className="flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50"
                style={{ color: "var(--primary)" }}
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bookmark className="w-3 h-3" />}
                {saving ? "Saving…" : "Save look"}
              </button>
              <button onClick={() => onItemsChange([])} className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--danger)" }}>
                <RefreshCw className="w-3 h-3" /> Clear
              </button>
            </div>
          )}
        </div>
        <div
          ref={canvasRef}
          className="relative w-full rounded-2xl border-2 border-dashed overflow-hidden"
          style={{ height, background: "var(--background)", borderColor: "var(--border)" }}
        >
          {items.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4">
              <Plus className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Search on the right, then drag or tap a result here
              </span>
            </div>
          )}
          {items.map((item) => (
            <CanvasPiece key={item.id} item={item} containerRef={canvasRef} onMove={handleMove} onRemove={handleRemove} />
          ))}
        </div>
      </div>

      {/* Search panel */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          {(["any", "women", "men"] as const).map((g) => (
            <button
              key={g}
              onClick={() => handleGenderChange(g)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                gender === g
                  ? "text-white border-transparent"
                  : "hover:bg-[var(--primary-light)]"
              )}
              style={
                gender === g
                  ? { background: "var(--primary)" }
                  : { borderColor: "var(--border)", color: "var(--text-secondary)" }
              }
            >
              {g === "any" ? "Any" : g === "women" ? "Women" : "Men"}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
            placeholder="e.g. cream knit sweater"
            className="flex-1 px-3 py-2.5 text-sm rounded-xl border outline-none focus:border-[var(--primary)]"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}
          />
          <button
            onClick={runSearch}
            disabled={loading || !query.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>

        <div
          className="grid grid-cols-3 gap-2 overflow-y-auto pr-1"
          style={{ height: height - 84 }}
        >
          {loading &&
            Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="w-full" style={{ aspectRatio: "1/1" }} />)}

          {!loading &&
            results.map((r, i) => (
              <DraggableThumbnail key={i} product={r} canvasRef={canvasRef} onDrop={addItemAt} onTap={addItemDefault} />
            ))}

          {!loading && searched && results.length === 0 && errorMessage && (
            <div className="col-span-3 text-center py-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "var(--primary-light)" }}>
                <Search className="w-5 h-5" style={{ color: "var(--primary)" }} />
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Search didn&apos;t finish</p>
              <p className="text-xs mt-1 mb-3" style={{ color: "var(--text-muted)" }}>{errorMessage}</p>
              <button
                onClick={runSearch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors hover:bg-[var(--primary-light)]"
                style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
              >
                <RefreshCw className="w-3 h-3" /> Try again
              </button>
            </div>
          )}

          {!loading && searched && results.length === 0 && !errorMessage && (
            <div className="col-span-3">
              <EmptyState icon={Search} title="No results" description="Try a different search term" />
            </div>
          )}

          {!loading && !searched && (
            <p className="col-span-3 text-xs text-center py-10" style={{ color: "var(--text-muted)" }}>
              Search for anything — drag a result onto the canvas, or tap it to add
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CanvasPiece({
  item,
  containerRef,
  onMove,
  onRemove,
}: {
  item: CanvasItem;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onMove: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
}) {
  const offset = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    offset.current = { x: e.clientX - item.x, y: e.clientY - item.y };
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const maxX = Math.max(0, rect.width - ITEM_SIZE);
    const maxY = Math.max(0, rect.height - ITEM_SIZE);
    const x = Math.min(Math.max(0, e.clientX - offset.current.x), maxX);
    const y = Math.min(Math.max(0, e.clientY - offset.current.y), maxY);
    onMove(item.id, x, y);
  };

  const handlePointerUp = () => setDragging(false);

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`group absolute select-none ${dragging ? "cursor-grabbing z-20" : "cursor-grab z-10"}`}
      style={{ left: item.x, top: item.y, width: ITEM_SIZE, height: ITEM_SIZE, touchAction: "none" }}
    >
      <div className="w-full h-full rounded-xl bg-white shadow-lg p-2 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- external retailer CDN, arbitrary hosts */}
        <img src={item.image} alt={item.title ?? "item"} draggable={false} className="max-w-full max-h-full object-contain pointer-events-none" />
      </div>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onRemove(item.id)}
        aria-label="Remove item"
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white shadow-sm border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
        style={{ borderColor: "var(--border)" }}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function DraggableThumbnail({
  product,
  canvasRef,
  onDrop,
  onTap,
}: {
  product: ProductMatch;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onDrop: (product: ProductMatch, x: number, y: number) => void;
  onTap: (product: ProductMatch) => void;
}) {
  const [preview, setPreview] = useState<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    movedRef.current = false;
    setPreview({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!preview) return;
    movedRef.current = true;
    setPreview({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (preview) {
      if (movedRef.current) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
          onDrop(product, e.clientX - rect.left - ITEM_SIZE / 2, e.clientY - rect.top - ITEM_SIZE / 2);
        }
      } else {
        onTap(product);
      }
    }
    setPreview(null);
    movedRef.current = false;
  };

  return (
    <>
      <button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative rounded-xl border overflow-hidden bg-[var(--background)] transition-colors hover:border-[var(--primary)] cursor-grab active:cursor-grabbing"
        style={{ aspectRatio: "1/1", borderColor: "var(--border)", touchAction: "none" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- external retailer CDN, arbitrary hosts */}
        <img src={product.image} alt={product.title ?? "item"} draggable={false} className="w-full h-full object-cover pointer-events-none" />
      </button>
      {preview &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: preview.x - ITEM_SIZE / 2,
              top: preview.y - ITEM_SIZE / 2,
              width: ITEM_SIZE,
              height: ITEM_SIZE,
              pointerEvents: "none",
              zIndex: 200,
            }}
          >
            <div className="w-full h-full rounded-xl bg-white shadow-2xl p-2 flex items-center justify-center opacity-90">
              {/* eslint-disable-next-line @next/next/no-img-element -- external retailer CDN, arbitrary hosts */}
              <img src={product.image} alt="" className="max-w-full max-h-full object-contain" />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
