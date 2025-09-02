"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RoleStep } from "./_components/role-step";
import { EmployerForm } from "./_components/employer-form";
import { CandidateForm } from "./_components/candidate-form";

type AppUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  is_onboarding_completed: boolean;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRow, setUserRow] = useState<AppUserRow | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const authedUser = authData.user;
      if (!authedUser) {
        router.replace("/auth/login");
        return;
      }

      const { data: rows } = await supabase
        .from("users")
        .select("id,email,full_name,avatar_url,role,is_onboarding_completed")
        .eq("id", authedUser.id)
        .limit(1)
        .maybeSingle();

      if (rows && rows.is_onboarding_completed && rows.role) {
        router.replace(rows.role === "employer" ? "/employer" : "/candidate");
        return;
      }

      setUserRow(rows as AppUserRow);
      setLoading(false);
    };

    void load();
  }, [router]);

  const role = useMemo(() => userRow?.role ?? null, [userRow]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading onboarding…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-3xl p-6">
        <h1 className="text-2xl font-semibold mb-2 text-center">Welcome! Let’s set up your account</h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          We’ll use this information to personalize your experience.
        </p>
        {!role || role === "" ? (
          <RoleStep
            initialFullName={userRow?.full_name ?? ""}
            initialAvatarUrl={userRow?.avatar_url ?? ""}
            onRoleSelected={(nextRole) => setUserRow((prev) => (prev ? { ...prev, role: nextRole } : prev))}
          />
        ) : role === "employer" ? (
          <>
            <Separator className="my-4" />
            <EmployerForm
              initialUserFullName={userRow?.full_name ?? ""}
              initialUserAvatarUrl={userRow?.avatar_url ?? ""}
              onCompleted={() => router.replace("/employer")}
            />
          </>
        ) : (
          <>
            <Separator className="my-4" />
            <CandidateForm
              initialUserFullName={userRow?.full_name ?? ""}
              initialUserAvatarUrl={userRow?.avatar_url ?? ""}
              onCompleted={() => router.replace("/candidate")}
            />
          </>
        )}
      </Card>
    </main>
  );
}


