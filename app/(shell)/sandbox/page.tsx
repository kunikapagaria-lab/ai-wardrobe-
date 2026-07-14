import { createClient } from "@/lib/supabase/server";
import { SandboxView } from "@/components/sandbox/SandboxView";

export default async function SandboxPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <SandboxView isLoggedIn={!!user} />;
}
