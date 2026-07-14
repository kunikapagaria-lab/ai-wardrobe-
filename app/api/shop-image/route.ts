import { NextRequest, NextResponse } from "next/server";
import { findProduct, fallbackShopUrl } from "@/lib/serpapi";
import { requireUser } from "@/lib/require-auth";

export const maxDuration = 20;

export async function POST(req: NextRequest) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  try {
    const { itemName, stylePreference } = await req.json();
    if (!itemName) return NextResponse.json({ error: "itemName required" }, { status: 400 });

    // Include the stated preference (e.g. "sportswear women") in the search
    // itself — without it, SerpApi has no gender/fit signal and can surface a
    // product photo that contradicts what the client asked for.
    const query = stylePreference?.trim() ? `${itemName} ${stylePreference.trim()}` : itemName;

    const product = await findProduct(query);
    return NextResponse.json({
      image: product?.image ?? null,
      shop_url: product?.shopUrl ?? fallbackShopUrl(itemName),
    });
  } catch {
    return NextResponse.json({ image: null, shop_url: null });
  }
}
