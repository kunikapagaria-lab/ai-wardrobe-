import type { SwatchAgg } from "@/lib/palette";

interface Props {
  swatches: SwatchAgg[];
}

export function SwatchCloud({ swatches }: Props) {
  const maxCount = Math.max(...swatches.map((s) => s.count), 1);
  const top = swatches.slice(0, 16);

  return (
    <div className="flex flex-wrap items-end gap-x-5 gap-y-4">
      {top.map((s) => {
        const size = 36 + Math.round((s.count / maxCount) * 44);
        return (
          <div key={s.label} className="flex flex-col items-center" style={{ width: 64 }}>
            <div
              className="rounded-full border shadow-sm"
              style={{ width: size, height: size, background: s.hex, borderColor: "var(--border)" }}
              title={`${s.label} · ${s.count}`}
            />
            <p className="text-[10px] font-medium mt-1.5 truncate w-full text-center" style={{ color: "var(--text-secondary)" }}>
              {s.label}
            </p>
            <p className="text-[9px]" style={{ color: "var(--text-muted)" }}>{s.count}×</p>
          </div>
        );
      })}
    </div>
  );
}
