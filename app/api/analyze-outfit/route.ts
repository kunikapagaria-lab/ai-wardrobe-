import { NextRequest, NextResponse } from "next/server";
import { analyzeOutfitPhoto } from "@/lib/groq";
import { requireUser } from "@/lib/require-auth";

export async function POST(req: NextRequest) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  try {
    const { photoUrl } = await req.json();
    if (!photoUrl) return NextResponse.json({ error: "photoUrl required" }, { status: 400 });
    const analysis = await analyzeOutfitPhoto(photoUrl);
    return NextResponse.json({ analysis });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
