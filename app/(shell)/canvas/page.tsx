import { createClient } from "@/lib/supabase/server";
import { CanvasView } from "@/components/canvas/CanvasView";

export default async function CanvasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <CanvasView isLoggedIn={!!user} />;
}
