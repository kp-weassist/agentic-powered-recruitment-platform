import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
   <>
   <h1>Admin Dashboard</h1>
   </>
  );
}
