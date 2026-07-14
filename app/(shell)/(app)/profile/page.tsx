"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shirt, Images, Bookmark, Moon, LogOut, Loader2 } from "lucide-react";
import { useWardrobeStore } from "@/store/wardrobe";
import { CATEGORY_LABELS } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

export default function ProfilePage() {
  const { items, outfitPhotos, savedOutfits, loading, fetchAll } = useWardrobeStore();
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't sign out");
      setSigningOut(false);
    }
  };

  const categoryCount: Record<string, number> = {};
  const colorCount: Record<string, number> = {};
  items.forEach((item) => {
    categoryCount[item.tags.category] = (categoryCount[item.tags.category] ?? 0) + 1;
    item.tags.colors.forEach((c) => { colorCount[c] = (colorCount[c] ?? 0) + 1; });
  });

  const topCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topColors = Object.entries(colorCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const unworn = items.filter((i) => !i.last_worn_at).length;
  const mostWorn = items.reduce<typeof items[0] | null>((best, item) =>
    !best || (item.wear_count ?? 0) > (best.wear_count ?? 0) ? item : best, null);

  const stats = [
    { label: "Total pieces", value: items.length, icon: Shirt },
    { label: "Outfit looks", value: outfitPhotos.length, icon: Images },
    { label: "Saved outfits", value: savedOutfits.length, icon: Bookmark },
    { label: "Never worn", value: unworn, icon: Moon },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Profile</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Your wardrobe insights</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      ) : (
      <>
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="card bg-white rounded-2xl border p-4 text-center" style={{ borderColor: "var(--border)" }}>
            <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: "var(--primary)" }} />
            <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>{s.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* By category */}
        <div className="card bg-white rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold mb-4" style={{ color: "var(--text)" }}>By category</h2>
          {topCategories.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No items yet</p>
          ) : (
            <div className="space-y-2.5">
              {topCategories.map(([cat, count]) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: "var(--text-secondary)" }}>{CATEGORY_LABELS[cat] ?? cat}</span>
                    <span className="font-medium" style={{ color: "var(--text)" }}>{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(count / items.length) * 100}%`, background: "var(--primary)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top colors */}
        <div className="card bg-white rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
          <h2 className="font-semibold mb-4" style={{ color: "var(--text)" }}>Top colors</h2>
          {topColors.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No items yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topColors.map(([color, count]) => (
                <div key={color} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border" style={{ borderColor: "var(--border)" }}>
                  <span className="text-sm font-medium capitalize" style={{ color: "var(--text)" }}>{color}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--primary-light)", color: "var(--primary-dark)" }}>{count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Most worn */}
          {mostWorn && (
            <div className="mt-5 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Most worn</p>
              <p className="text-sm font-semibold capitalize" style={{ color: "var(--text)" }}>
                {mostWorn.name ?? CATEGORY_LABELS[mostWorn.tags.category]} · {mostWorn.wear_count}x
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 card bg-white rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-2 text-sm font-semibold disabled:opacity-50"
          style={{ color: "var(--danger)" }}
        >
          {signingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
      </>
      )}
    </div>
  );
}
