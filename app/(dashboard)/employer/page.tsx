import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function EmployerDashboard() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Ensure onboarding complete and correct role
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (uid) {
    const { data: userRow } = await supabase
      .from("users")
      .select("role,is_onboarding_completed")
      .eq("id", uid)
      .maybeSingle();
    if (!userRow || !userRow.is_onboarding_completed) {
      redirect("/onboarding");
    }
    if (userRow.role !== "employer") {
      redirect("/");
    }
  }

  return (
   <>
   <h1>Employer Dashboard</h1>
   </>
  );
}
