"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Search, Loader2, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/lib/toast";
import type { ProductMatch } from "@/lib/serpapi";

interface Props {
  open: boolean;
  onClose: () => void;
  initialQuery: string;
  onSelect: (product: ProductMatch) => void;
}

export function ProductPickerDialog({ open, onClose, initialQuery, onSelect }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ProductMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/shop-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
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

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setQuery(initialQuery);
      setResults([]);
      setSearched(false);
      setErrorMessage(null);
      onClose();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-white rounded-2xl w-[calc(100%-2rem)] max-w-2xl shadow-xl max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10" style={{ borderColor: "var(--border)" }}>
            <Dialog.Title className="font-semibold" style={{ color: "var(--text)" }}>Browse styles</Dialog.Title>
            <Dialog.Description className="sr-only">Search for real product photos to pick from</Dialog.Description>
            <Dialog.Close asChild>
              <button aria-label="Close" className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6">
            <div className="flex gap-2 mb-5">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
                placeholder="e.g. cream knit sweater"
                className="flex-1 px-3 py-2.5 text-sm rounded-xl border outline-none focus:border-[var(--primary)]"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
                autoFocus
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

            {loading && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="w-full" style={{ aspectRatio: "1/1" }} />
                ))}
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => onSelect(r)}
                    className="group relative rounded-xl border overflow-hidden bg-[var(--background)] transition-colors hover:border-[var(--primary)]"
                    style={{ aspectRatio: "1/1", borderColor: "var(--border)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- external retailer CDN, arbitrary hosts */}
                    <img src={r.image} alt={r.title ?? query} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </button>
                ))}
              </div>
            )}

            {!loading && searched && results.length === 0 && errorMessage && (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "var(--primary-light)" }}>
                  <Search className="w-6 h-6" style={{ color: "var(--primary)" }} />
                </div>
                <p className="font-semibold" style={{ color: "var(--text)" }}>Search didn&apos;t finish</p>
                <p className="text-sm mt-1 mb-4" style={{ color: "var(--text-muted)" }}>{errorMessage}</p>
                <button
                  onClick={runSearch}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors hover:bg-[var(--primary-light)]"
                  style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try again
                </button>
              </div>
            )}

            {!loading && searched && results.length === 0 && !errorMessage && (
              <EmptyState icon={Search} title="No results" description="Try a different search term" />
            )}

            {!loading && !searched && (
              <p className="text-xs text-center py-8" style={{ color: "var(--text-muted)" }}>
                Search to see real product photos and pick the style you like
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
