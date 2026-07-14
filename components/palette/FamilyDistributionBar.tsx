import { FAMILY_LABELS, FAMILY_SWATCH, type ColorFamily } from "@/lib/colors";

interface Props {
  familyCounts: Record<ColorFamily, number>;
  total: number;
}

const ORDER: ColorFamily[] = ["neutral", "warm", "cool", "bright", "pastel"];

export function FamilyDistributionBar({ familyCounts, total }: Props) {
  if (total === 0) return null;

  return (
    <div>
      <div className="h-3 rounded-full overflow-hidden flex" style={{ background: "var(--border)" }}>
        {ORDER.map((family) => {
          const pct = (familyCounts[family] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={family}
              style={{ width: `${pct}%`, background: FAMILY_SWATCH[family] }}
              title={`${FAMILY_LABELS[family]} · ${Math.round(pct)}%`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {ORDER.filter((f) => familyCounts[f] > 0).map((family) => (
          <div key={family} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: FAMILY_SWATCH[family] }} />
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {FAMILY_LABELS[family]} · {Math.round((familyCounts[family] / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
