import { NextRequest, NextResponse } from "next/server";
import { generateMixMatch } from "@/lib/groq";
import { randomUUID } from "crypto";
import { requireUser } from "@/lib/require-auth";
import type { ClothingItem } from "@/types";

export async function POST(req: NextRequest) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  try {
    const { wardrobe, count = 4 } = await req.json();
    if (!wardrobe || wardrobe.length < 2)
      return NextResponse.json({ error: "Need at least 2 items" }, { status: 400 });

    const suggestions = await generateMixMatch(wardrobe, count);
    const itemMap = new Map<string, ClothingItem>(wardrobe.map((i: ClothingItem) => [i.id, i]));

    const results = suggestions
      .map((s) => {
        const items = s.item_ids.map((id) => itemMap.get(id)).filter(Boolean);
        if (items.length < 2) return null;
        return { id: randomUUID(), items, headline: s.headline, reasoning: s.reasoning, is_new_pairing: s.is_new_pairing };
      })
      .filter(Boolean);

    return NextResponse.json({ suggestions: results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Mix & match failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
