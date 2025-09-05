import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }
  const { data: userRow } = await supabase
    .from("users")
    .select("role,is_onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();
  if (!userRow || !userRow.is_onboarding_completed) {
    redirect("/onboarding");
  }
  return (

      <main className="min-h-screen flex flex-col items-center">
        {children}
      </main>
  );
}
