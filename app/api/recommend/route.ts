import { NextRequest, NextResponse } from "next/server";
import { generateOutfitRecommendations } from "@/lib/groq";
import { randomUUID } from "crypto";
import { requireUser } from "@/lib/require-auth";
import type { ClothingItem } from "@/types";

export async function POST(req: NextRequest) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  try {
    const { wardrobe, occasion, count = 4 } = await req.json();
    if (!wardrobe?.length || !occasion)
      return NextResponse.json({ error: "wardrobe and occasion required" }, { status: 400 });

    const combos = await generateOutfitRecommendations(wardrobe, occasion, count);
    const itemMap = new Map<string, ClothingItem>(wardrobe.map((i: ClothingItem) => [i.id, i]));

    const outfits = combos
      .map((combo) => {
        const items = combo.item_ids.map((id) => itemMap.get(id)).filter(Boolean);
        if (items.length < 2) return null;
        return { id: randomUUID(), items, occasion, reasoning: combo.reasoning, style_notes: combo.style_notes };
      })
      .filter(Boolean);

    return NextResponse.json({ outfits });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Recommendation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
