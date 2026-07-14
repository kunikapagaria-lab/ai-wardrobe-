"use client";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore } from "@/lib/toast";

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  default: Info,
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div role="status" aria-live="polite" className="fixed bottom-20 lg:bottom-6 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {toasts.map((t) => {
        const Icon = ICONS[t.variant];
        const color = t.variant === "success" ? "var(--primary)" : t.variant === "error" ? "var(--danger)" : "var(--text)";
        return (
          <div
            key={t.id}
            className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-white border shadow-lg"
            style={{ borderColor: "var(--border)", animation: "toast-in 0.18s ease-out" }}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color }} />
            <p className="text-sm flex-1" style={{ color: "var(--text)" }}>{t.message}</p>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="shrink-0">
              <X className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
