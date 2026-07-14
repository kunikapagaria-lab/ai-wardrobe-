import { Lightbulb, CheckCircle2 } from "lucide-react";

interface Props {
  gaps: string[];
}

export function GapInsights({ gaps }: Props) {
  if (gaps.length === 0) {
    return (
      <div className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
        <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--primary)" }} />
        Your wardrobe&rsquo;s color coverage looks well balanced.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {gaps.map((gap, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--primary)" }} />
          {gap}
        </li>
      ))}
    </ul>
  );
}
