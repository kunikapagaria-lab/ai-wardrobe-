import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// These routes proxy to paid external APIs (Groq, remove.bg, SerpApi) — call
// this first in any route that isn't meant to be reachable by anonymous
// visitors, so an unauthenticated request can't run up the bill.
export async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { user: null, unauthorized: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { user, unauthorized: null as null };
}
