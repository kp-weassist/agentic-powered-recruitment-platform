"use client";

import { hasEnvVars, cn } from "@/lib/utils";
import { EnvVarWarning } from "../env-var-warning";
import { AuthButton } from "../auth-button";
import { ThemeSwitcher } from "./theme-switcher";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";



type AppUserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: "candidate" | "employer" | "admin" | null;
};

function DashboardLink() {
  const [userRow, setUserRow] = useState<AppUserRow | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const authedUser = authData.user;
      if (!authedUser) {
        if (isMounted) setIsAuthed(false);
        return;
      }
      if (isMounted) setIsAuthed(true);

      const { data: row } = await supabase
        .from("users")
        .select("id,email,full_name,avatar_url,role")
        .eq("id", authedUser.id)
        .limit(1)
        .maybeSingle();

      if (isMounted) setUserRow(row as AppUserRow);
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  const destination = useMemo(() => {
    if (!userRow?.role) return "/";
    if (userRow.role === "candidate") return "/candidate";
    if (userRow.role === "employer") return "/employer";
    if (userRow.role === "admin") return "/admin";
    return "/";
  }, [userRow]);

  if (!isAuthed) return null;

  const displayName = userRow?.full_name || userRow?.email || "User";
  const avatarUrl = userRow?.avatar_url || undefined;
  const fallback = (displayName || "U").charAt(0).toUpperCase();

  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "h-10 rounded-full px-2 pr-3",
        "border bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40",
        "hover:bg-accent/60 transition-colors"
      )}
    >
      <Link href={destination} aria-label={`Go to ${userRow?.role ?? ""} dashboard`}>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-primary/30">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm font-medium">Dashboard</span>
          {userRow?.role ? (
            <Badge variant="outline" className="hidden md:inline text-[10px] font-medium px-2 py-0.5 rounded-full">
              {userRow.role.charAt(0).toUpperCase() + userRow.role.slice(1)}
            </Badge>
          ) : null}
          <ChevronRight className="hidden sm:inline h-4 w-4 text-muted-foreground" />
        </div>
      </Link>
    </Button>
  );
}

export default function Navbar() {
    return (
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>🤖 Agentic Powered Recruitment Platform</Link>
            </div>
            {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <DashboardLink />
          </div>
        </nav>
    );
}