import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Demo credentials live server-side only now — previously they were hardcoded
// in a "use client" page and shipped straight into the browser bundle, where
// anyone could read them via view-source and sign in directly through the
// Supabase SDK from outside the app.
export async function POST() {
  const email = process.env.WARDROBE_DEMO_EMAIL;
  const password = process.env.WARDROBE_DEMO_PASSWORD;
  if (!email || !password) {
    return NextResponse.json({ error: "Demo login isn't configured (missing WARDROBE_DEMO_EMAIL/PASSWORD)" }, { status: 500 });
  }

  const supabase = await createClient();

  try {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      const errMsg = signInError.message.toLowerCase();

      if (errMsg.includes("email not confirmed")) {
        throw new Error("Email confirmation is enabled on your Supabase project. Please log into your Supabase Dashboard, go to 'Authentication' -> 'Users', and create the demo user with 'Auto-confirm User' enabled.");
      }

      if (errMsg.includes("invalid login credentials") || errMsg.includes("user not found")) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });

        if (signUpError) {
          const signUpMsg = signUpError.message.toLowerCase();
          if (signUpMsg.includes("rate limit") || signUpMsg.includes("rate_limit")) {
            throw new Error("Supabase rate limit exceeded. Please log into your Supabase Dashboard, go to 'Authentication' -> 'Users', and create the demo user manually with 'Auto-confirm User' toggled ON.");
          }
          throw signUpError;
        }

        const { error: retryError } = await supabase.auth.signInWithPassword({ email, password });
        if (retryError) throw retryError;
      } else {
        throw signInError;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to connect to digital wardrobe.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
