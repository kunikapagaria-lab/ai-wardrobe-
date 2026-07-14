import { NextRequest, NextResponse } from "next/server";
import { analyzeClothing } from "@/lib/groq";
import { requireUser } from "@/lib/require-auth";

export async function POST(req: NextRequest) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  try {
    const { photoUrl } = await req.json();
    if (!photoUrl) return NextResponse.json({ error: "photoUrl required" }, { status: 400 });
    const tags = await analyzeClothing(photoUrl);
    return NextResponse.json({ tags });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
