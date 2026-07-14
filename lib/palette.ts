import type { ClothingItem, ClothingCategory } from "@/types";
import { resolveColor, FAMILY_LABELS, type ColorFamily } from "./colors";
import { CATEGORY_LABELS } from "./utils";

export interface SwatchAgg {
  label: string;
  hex: string;
  family: ColorFamily;
  count: number;
}

export type CategoryFamilyMatrix = Partial<Record<ClothingCategory, Record<ColorFamily, number>>>;

export interface PaletteInsights {
  swatches: SwatchAgg[];
  familyCounts: Record<ColorFamily, number>;
  totalMentions: number;
  categoryMatrix: CategoryFamilyMatrix;
  categories: ClothingCategory[];
  gaps: string[];
}

const CORE_CATEGORIES: ClothingCategory[] = ["top", "bottom", "outerwear", "dress", "shoes"];
const FAMILIES: ColorFamily[] = ["neutral", "warm", "cool", "bright", "pastel"];

function emptyFamilyCounts(): Record<ColorFamily, number> {
  return { neutral: 0, warm: 0, cool: 0, bright: 0, pastel: 0 };
}

export function computePaletteInsights(items: ClothingItem[]): PaletteInsights {
  const swatchMap = new Map<string, SwatchAgg>();
  const familyCounts = emptyFamilyCounts();
  const categoryMatrix: CategoryFamilyMatrix = {};
  const categoryTotals: Partial<Record<ClothingCategory, number>> = {};
  let totalMentions = 0;

  for (const item of items) {
    const category = item.tags.category;
    for (const colorName of item.tags.colors) {
      const resolved = resolveColor(colorName);
      totalMentions++;
      familyCounts[resolved.family]++;

      const existing = swatchMap.get(resolved.label);
      if (existing) existing.count++;
      else swatchMap.set(resolved.label, { label: resolved.label, hex: resolved.hex, family: resolved.family, count: 1 });

      if (!categoryMatrix[category]) categoryMatrix[category] = emptyFamilyCounts();
      categoryMatrix[category]![resolved.family]++;
      categoryTotals[category] = (categoryTotals[category] ?? 0) + 1;
    }
  }

  const swatches = Array.from(swatchMap.values()).sort((a, b) => b.count - a.count);
  const categories = Object.keys(categoryMatrix) as ClothingCategory[];

  const gaps: string[] = [];
  for (const cat of CORE_CATEGORIES) {
    const total = categoryTotals[cat] ?? 0;
    if (total === 0) continue;
    const neutralCount = categoryMatrix[cat]?.neutral ?? 0;
    if (neutralCount === 0) {
      gaps.push(`No neutral ${CATEGORY_LABELS[cat].toLowerCase()} yet — a neutral piece here would anchor more outfits.`);
    }
  }

  if (totalMentions > 0) {
    const dominant = FAMILIES.reduce((a, b) => (familyCounts[b] > familyCounts[a] ? b : a));
    const share = Math.round((familyCounts[dominant] / totalMentions) * 100);
    if (share >= 45) {
      gaps.push(`${share}% of your wardrobe leans ${FAMILY_LABELS[dominant].toLowerCase()} — mixing in another palette would open up new pairings.`);
    }
  }

  return { swatches, familyCounts, totalMentions, categoryMatrix, categories, gaps };
}
