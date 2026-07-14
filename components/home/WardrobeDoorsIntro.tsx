"use client";
import { useEffect, useState } from "react";

// Must match the key in the root layout's blocking inline script — that
// script marks <html class="wd-seen"> synchronously before first paint,
// which is what actually keeps the intro from flashing on repeat visits.
// This component's own sessionStorage check is just there to skip its own
// (now invisible, since CSS already hid it) animation timers.
const SEEN_KEY = "wardrobeai-doors-seen";
// How long the small, closed cupboard holds on screen before it starts
// growing — long enough to actually register as "a little cupboard" rather
// than a flicker.
const HOLD_MS = 650;
// Must exceed the CSS zoom transition (2s) so the stage doesn't unmount
// mid-zoom, plus enough of a tail for the door-open animation (which starts
// partway through the zoom, see globals.css) to finish.
const OPEN_DURATION_MS = 2400;

type Phase = "hidden" | "closed" | "opening";

export function WardrobeDoorsIntro({ children }: { children: React.ReactNode }) {
  // Starting "closed" is safe for hydration now — it's a hardcoded literal,
  // not something read from sessionStorage, so server and client always
  // agree on the first render. Whether the intro is actually *visible* is
  // decided by CSS (via the .wd-seen class set before paint), not by this
  // initial state.
  const [phase, setPhase] = useState<Phase>("closed");
  const [visible, setVisible] = useState(false);

  // On a repeat visit within the same session, the stage is already hidden
  // by CSS — this just stops the (now invisible) animation from running its
  // timers pointlessly. On a first visit, it marks the session as seen so
  // the *next* page load's blocking script hides the intro before paint.
  useEffect(() => {
    if (sessionStorage.getItem(SEEN_KEY)) {
      Promise.resolve().then(() => setPhase("hidden"));
      return;
    }
    sessionStorage.setItem(SEEN_KEY, "1");
  }, []);

  // Fades the cupboard icon in on arrival instead of having it pop into
  // existence — a double rAF so the browser paints the opacity:0 frame
  // first, giving the subsequent class change something to transition from.
  // This is deliberately on the cupboard, not the stage backdrop: the
  // backdrop's whole job is hiding the real page, so it must be opaque from
  // the very first frame, never mid-fade.
  useEffect(() => {
    if (phase !== "closed") return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [phase]);

  // Each effect only schedules the transition out of the phase it watches.
  // Combining both timers in one [phase]-keyed effect would mean the
  // "closed" -> "opening" transition's own cleanup clears the still-pending
  // hide timer before it ever fires, leaving the cupboard stuck open forever.
  useEffect(() => {
    if (phase !== "closed") return;
    const timer = setTimeout(() => setPhase("opening"), HOLD_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "opening") return;
    const timer = setTimeout(() => setPhase("hidden"), OPEN_DURATION_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  const stageVisible = phase === "closed" || phase === "opening";
  const opening = phase === "opening";

  return (
    <>
      {stageVisible && (
        <div
          className={`wardrobe-stage ${opening ? "wardrobe-stage-opening" : ""}`}
          aria-hidden="true"
        >
          <div className={`wardrobe-cupboard ${visible ? "wardrobe-cupboard-visible" : ""} ${opening ? "wardrobe-cupboard-open" : ""}`}>
            <div className="wardrobe-cupboard-cornice" />
            <div className="wardrobe-cupboard-body">
              <div className="wardrobe-cupboard-door wardrobe-cupboard-door-left" />
              <div className="wardrobe-cupboard-door wardrobe-cupboard-door-right" />
            </div>
            <div className="wardrobe-cupboard-foot wardrobe-cupboard-foot-left" />
            <div className="wardrobe-cupboard-foot wardrobe-cupboard-foot-right" />
          </div>
          <span className={`wardrobe-stage-brand ${opening ? "wardrobe-stage-brand-fade" : ""}`}>WardrobeAI</span>
        </div>
      )}
      {children}
    </>
  );
}
