import { NextRequest, NextResponse } from "next/server";
import { generateShoppingRecommendations } from "@/lib/groq";
import { computePaletteInsights } from "@/lib/palette";
import { fallbackShopUrl } from "@/lib/serpapi";
import { randomUUID } from "crypto";
import { requireUser } from "@/lib/require-auth";
import type { ClothingItem } from "@/types";

// Defense in depth: the model is instructed not to cite item ids in prose, but
// strip any that slip through so raw UUIDs never reach the UI.
const UUID_PATTERN = /\s*\(?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\)?/gi;
function stripIds(text: string): string {
  return text.replace(UUID_PATTERN, "").replace(/\s{2,}/g, " ").trim();
}

export async function POST(req: NextRequest) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  try {
    const { wardrobe, count = 4, stylePreference } = await req.json();
    if (!wardrobe?.length || wardrobe.length < 3)
      return NextResponse.json({ error: "Add at least 3 items to your wardrobe first" }, { status: 400 });

    const { gaps } = computePaletteInsights(wardrobe);
    const combos = await generateShoppingRecommendations(wardrobe, gaps, count, stylePreference);
    const itemMap = new Map<string, ClothingItem>(wardrobe.map((i: ClothingItem) => [i.id, i]));

    // Real product photos/links are looked up separately (see /api/shop-image) so
    // this route can return as soon as the AI suggestions are ready, instead of
    // blocking on several external SerpApi calls.
    const suggestions = combos
      .map((combo) => {
        const pairs_with = combo.pairs_with_item_ids.map((id) => itemMap.get(id)).filter(Boolean);
        if (pairs_with.length === 0) return null;
        return {
          id: randomUUID(),
          item_name: combo.item_name,
          category: combo.category,
          colors: combo.colors,
          style: combo.style,
          reasoning: stripIds(combo.reasoning),
          pairs_with,
          image: null,
          shop_url: fallbackShopUrl(combo.item_name),
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);

    return NextResponse.json({ suggestions });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Shopping recommendation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
