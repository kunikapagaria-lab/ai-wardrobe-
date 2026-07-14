"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { useConfirmStore } from "@/lib/confirm";

export function ConfirmDialog() {
  const { open, title, description, confirmLabel, danger, close } = useConfirmStore();

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) close(false); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] w-[calc(100%-2rem)] max-w-sm bg-white rounded-2xl shadow-xl p-6">
          <Dialog.Title className="font-semibold text-base" style={{ color: "var(--text)" }}>{title}</Dialog.Title>
          {description && (
            <Dialog.Description className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}>
              {description}
            </Dialog.Description>
          )}
          <div className="flex gap-2 mt-5">
            <button
              onClick={() => close(false)}
              className="flex-1 py-2 rounded-xl text-sm font-medium border transition-colors hover:bg-gray-50"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              Cancel
            </button>
            <button
              onClick={() => close(true)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: danger ? "var(--danger)" : "var(--primary)" }}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
