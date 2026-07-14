"use client";
import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Home, Shirt, Sparkles, CalendarDays, User, Palette, ShoppingBag, Layers, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";
import { useWardrobeStore } from "@/store/wardrobe";
import { toast } from "@/lib/toast";
import { PENDING_LOOK_KEY, type CanvasItem } from "@/components/shop/CanvasWorkspace";
import type { ShoppingSuggestion } from "@/types";

const HOME_NAV = { href: "/", label: "Home", icon: Home };

const LOGGED_OUT_NAV = [HOME_NAV, { href: "/login", label: "Sign in", icon: LogIn }];

// Exported so the page-slide transition can derive its left-to-right order
// from the same source instead of duplicating this list.
export const LOGGED_IN_NAV = [
  HOME_NAV,
  { href: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { href: "/outfits", label: "Style AI", icon: Sparkles },
  { href: "/palette", label: "Palette", icon: Palette },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/canvas", label: "Canvas", icon: Layers },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: User },
];

function usePendingLookAutoSave() {
  const saveToWishlist = useWardrobeStore((s) => s.saveToWishlist);

  useEffect(() => {
    const raw = localStorage.getItem(PENDING_LOOK_KEY);
    if (!raw) return;

    let items: CanvasItem[];
    try {
      items = JSON.parse(raw);
      if (!Array.isArray(items) || items.length === 0) {
        localStorage.removeItem(PENDING_LOOK_KEY);
        return;
      }
    } catch {
      localStorage.removeItem(PENDING_LOOK_KEY);
      return;
    }

    (async () => {
      // A look saved while signed out waits here until a session actually
      // exists — only then do we consume it, so it survives the brief window
      // between the save click and the auto-login redirect completing. A
      // network failure here must not become an unhandled rejection — this
      // runs unattended on every mount, with nothing else to catch it.
      const supabase = createClient();
      let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"];
      try {
        user = (await supabase.auth.getUser()).data.user;
      } catch {
        return; // leave the pending look in place — retry on a later mount
      }
      if (!user) return;

      localStorage.removeItem(PENDING_LOOK_KEY);
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
        toast.success(`Saved ${items.length} item${items.length !== 1 ? "s" : ""} from your canvas look`);
      } catch {
        toast.error("Couldn't save your canvas look");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function TopNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  usePendingLookAutoSave();
  const NAV = isLoggedIn ? LOGGED_IN_NAV : LOGGED_OUT_NAV;

  return (
    <header className="sticky top-0 z-20 wardrobe-theme-nav">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-6 h-16">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Logo size={26} />
          <span className="font-display text-lg tracking-tight hidden sm:inline" style={{ color: "var(--text)" }}>
            WardrobeAI
          </span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto flex-1 min-w-0">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors shrink-0",
                  active
                    ? "text-[var(--primary-dark)] bg-[var(--primary-light)]"
                    : "text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text)]"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
