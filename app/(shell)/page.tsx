import { createClient } from "@/lib/supabase/server";
import { HomeContent } from "@/components/home/HomeContent";
import { WardrobeDoorsIntro } from "@/components/home/WardrobeDoorsIntro";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <WardrobeDoorsIntro>
      <HomeContent isLoggedIn={!!user} />
    </WardrobeDoorsIntro>
  );
}
