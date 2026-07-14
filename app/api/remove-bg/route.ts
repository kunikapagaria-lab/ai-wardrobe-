import { NextRequest, NextResponse } from "next/server";
import { removeBackground } from "@/lib/remove-bg";
import { requireUser } from "@/lib/require-auth";

export async function POST(req: NextRequest) {
  const { unauthorized } = await requireUser();
  if (unauthorized) return unauthorized;

  try {
    const { photoUrl } = await req.json();
    if (!photoUrl) return NextResponse.json({ error: "photoUrl required" }, { status: 400 });
    const base64 = await removeBackground(photoUrl);
    return NextResponse.json({ base64 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Background removal failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
