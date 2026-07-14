"use client";
import { useState, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Upload, Shirt, ImagePlus, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";

type UploadMode = "item" | "outfit";

interface Props {
  onClose: () => void;
  onUpload: (file: File, mode: UploadMode) => Promise<void>;
}

export function UploadModal({ onClose, onUpload }: Props) {
  const [mode, setMode] = useState<UploadMode>("item");
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      await onUpload(file, mode);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl w-[calc(100%-2rem)] max-w-md shadow-xl"
          onEscapeKeyDown={(e) => { if (loading) e.preventDefault(); }}
          onPointerDownOutside={(e) => { if (loading) e.preventDefault(); }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <Dialog.Title className="font-semibold" style={{ color: "var(--text)" }}>Add to wardrobe</Dialog.Title>
            <Dialog.Description className="sr-only">Upload a photo of a clothing item or full outfit</Dialog.Description>
            <Dialog.Close asChild>
              <button
                aria-label="Close"
                disabled={loading}
                className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6 space-y-5">
            {/* Mode selector */}
            <div className="grid grid-cols-2 gap-3">
              {([
                { key: "item", label: "Single item", desc: "One clothing piece", icon: Shirt },
                { key: "outfit", label: "Full outfit", desc: "AI detects all pieces", icon: ImagePlus },
              ] as const).map(({ key, label, desc, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  disabled={loading}
                  className={`p-4 rounded-xl border-2 text-left transition-colors disabled:opacity-50 ${
                    mode === key ? "border-[var(--primary)] bg-[var(--primary-light)]" : "border-[var(--border)]"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${mode === key ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`} />
                  <p className="text-sm font-semibold" style={{ color: mode === key ? "var(--primary-dark)" : "var(--text)" }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
                </button>
              ))}
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { if (loading) return; e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (loading) return;
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              onClick={() => !loading && inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${loading ? "cursor-default" : "cursor-pointer"} ${
                dragOver ? "border-[var(--primary)] bg-[var(--primary-light)]" : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-gray-50"
              }`}
            >
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--primary)" }} />
                  <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                    {mode === "item" ? "Analyzing & removing background…" : "Analyzing outfit…"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Drop photo here or click to browse</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>JPG, PNG, WEBP up to 10MB</p>
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
