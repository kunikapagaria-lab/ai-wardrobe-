import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon, title, description }: Props) {
  return (
    <div className="text-center py-20">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ background: "var(--primary-light)" }}
      >
        <Icon className="w-6 h-6" style={{ color: "var(--primary)" }} />
      </div>
      <p className="font-semibold" style={{ color: "var(--text)" }}>{title}</p>
      {description && (
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{description}</p>
      )}
    </div>
  );
}
