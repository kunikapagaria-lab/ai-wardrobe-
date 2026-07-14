import { FAMILY_LABELS, FAMILY_SWATCH, hexToRgba, type ColorFamily } from "@/lib/colors";
import type { CategoryFamilyMatrix } from "@/lib/palette";
import { CATEGORY_LABELS } from "@/lib/utils";
import type { ClothingCategory } from "@/types";

interface Props {
  categories: ClothingCategory[];
  matrix: CategoryFamilyMatrix;
}

const FAMILIES: ColorFamily[] = ["neutral", "warm", "cool", "bright", "pastel"];

export function CategoryColorGrid({ categories, matrix }: Props) {
  const maxCount = Math.max(1, ...categories.flatMap((c) => FAMILIES.map((f) => matrix[c]?.[f] ?? 0)));

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px]">
        <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${FAMILIES.length}, 1fr)` }}>
          <div />
          {FAMILIES.map((f) => (
            <div key={f} className="text-[10px] font-semibold text-center pb-1.5" style={{ color: "var(--text-muted)" }}>
              {FAMILY_LABELS[f]}
            </div>
          ))}

          {categories.map((cat) => (
            <div key={cat} className="contents">
              <div className="text-xs font-medium py-2 pr-2 flex items-center capitalize" style={{ color: "var(--text-secondary)" }}>
                {CATEGORY_LABELS[cat] ?? cat}
              </div>
              {FAMILIES.map((f) => {
                const count = matrix[cat]?.[f] ?? 0;
                const alpha = count === 0 ? 0 : 0.15 + (count / maxCount) * 0.65;
                return (
                  <div
                    key={f}
                    className="rounded-lg flex items-center justify-center text-xs font-semibold h-9 my-0.5"
                    style={{
                      background: count === 0 ? "var(--background)" : hexToRgba(FAMILY_SWATCH[f], alpha),
                      color: count === 0 ? "var(--text-muted)" : alpha > 0.45 ? "white" : "var(--text)",
                      border: count === 0 ? "1px dashed var(--border)" : "none",
                    }}
                  >
                    {count === 0 ? "–" : count}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
