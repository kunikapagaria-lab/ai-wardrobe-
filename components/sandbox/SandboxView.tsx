"use client";
import { useState } from "react";
import { CanvasWorkspace, type CanvasItem } from "@/components/shop/CanvasWorkspace";

export function SandboxView({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Sandbox</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Search real product photos and drag them onto the canvas to see how everything looks together
          {!isLoggedIn && " — no sign-in required to try it"}
        </p>
      </div>

      <CanvasWorkspace items={canvasItems} onItemsChange={setCanvasItems} height={480} isLoggedIn={isLoggedIn} />
    </div>
  );
}
