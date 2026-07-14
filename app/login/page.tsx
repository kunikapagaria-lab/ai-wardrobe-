"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const performAutoLogin = async () => {
      try {
        const res = await fetch("/api/auto-login", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to connect to digital wardrobe.");

        if (active) {
          router.push("/");
          router.refresh();
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to connect to digital wardrobe.");
        }
      }
    };

    performAutoLogin();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm text-center px-4">
        {/* Logo/Icon */}
        <div className="mb-5 flex justify-center">
          <Logo size={64} className="shadow-sm transition-transform hover:scale-105" />
        </div>

        <h1 className="font-display text-3xl tracking-tight mb-2" style={{ color: "var(--text)" }}>WardrobeAI</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Auto-connecting to your digital closet...</p>

        {error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm border border-red-100 shadow-sm">
            <p className="font-semibold mb-1">Connection Error</p>
            <p className="text-xs opacity-90">{error}</p>
          </div>
        ) : (
          <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full border bg-white shadow-sm text-sm" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
            <span>Establishing secure Supabase session...</span>
          </div>
        )}
      </div>
    </div>
  );
}
