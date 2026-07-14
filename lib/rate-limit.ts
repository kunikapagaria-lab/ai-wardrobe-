import { NextRequest, NextResponse } from "next/server";

// Single-process, in-memory sliding-window limiter. Good enough to blunt
// casual abuse of a guest-accessible route on a single dev/small-scale
// deployment — it resets on redeploy and won't coordinate across multiple
// server instances, so treat it as a speed bump, not a hard guarantee.
const hits = new Map<string, number[]>();

function clientKey(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function rateLimit(req: NextRequest, { limit, windowMs }: { limit: number; windowMs: number }): NextResponse | null {
  const key = clientKey(req);
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    return NextResponse.json(
      { error: "Too many searches — please wait a moment and try again." },
      { status: 429 }
    );
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return null;
}
