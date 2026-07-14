import { createClient } from "@/lib/supabase/server";
import { TopNav } from "@/components/layout/TopNav";

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <TopNav isLoggedIn={!!user} />
      <main>{children}</main>
    </div>
  );
}
