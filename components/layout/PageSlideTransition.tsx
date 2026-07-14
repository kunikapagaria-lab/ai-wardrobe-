"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { LOGGED_IN_NAV } from "@/components/layout/TopNav";

// Left-to-right nav order, minus Home (this transition only wraps the
// protected app pages — Home and Sandbox live outside this layout).
const PAGE_ORDER = LOGGED_IN_NAV.map((item) => item.href).filter((href) => href !== "/");

export function PageSlideTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  // Adjusting state during render (not in an effect) when a prop changes —
  // React's own recommended pattern for this exact case ("You Might Not
  // Need An Effect"). It re-renders immediately with the new state before
  // anything paints, so the slide direction is correct from the very first
  // frame instead of applying a tick late the way an effect-based version
  // would.
  if (prevPathname !== pathname) {
    const oldIndex = PAGE_ORDER.indexOf(prevPathname);
    const newIndex = PAGE_ORDER.indexOf(pathname);
    setDirection(newIndex >= oldIndex ? "forward" : "backward");
    setPrevPathname(pathname);
  }

  // key={pathname} forces a fresh mount on every navigation, which is what
  // makes the CSS animation replay each time instead of only running once.
  return (
    <div key={pathname} className={`page-slide page-slide-${direction}`}>
      {children}
    </div>
  );
}
