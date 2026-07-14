import { NextRequest, NextResponse } from "next/server";
import { findProducts } from "@/lib/serpapi";
import { rateLimit } from "@/lib/rate-limit";

// SerpApi searches can take 10-35s on a cache miss — give the platform (e.g.
// Vercel, which defaults to a much shorter function timeout) enough headroom.
export const maxDuration = 60;

// This is the one search route the public, signed-out Sandbox is allowed to
// call — so it can't require auth like the others. Rate-limit it per IP
// instead, so it can't be scripted into an unlimited free SerpApi proxy.
export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { limit: 10, windowMs: 2 * 60 * 1000 });
  if (limited) return limited;

  try {
    const { query } = await req.json();
    if (!query?.trim()) return NextResponse.json({ error: "query required" }, { status: 400 });

    const results = await findProducts(query.trim(), 12);
    return NextResponse.json({ results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Search failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
