"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileUpload } from "@/components/upload/file-upload";
import { motion } from "framer-motion";
import { Briefcase, User2 } from "lucide-react";
import { toast } from "sonner";

export function RoleStep({
  initialFullName,
  initialAvatarUrl,
  onRoleSelected,
}: {
  initialFullName: string;
  initialAvatarUrl: string;
  onRoleSelected: (role: "employer" | "candidate") => void;
}) {
  const supabase = createClient();
  const [fullName, setFullName] = useState(initialFullName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [saving, setSaving] = useState(false);

  const saveCoreProfile = async (role: "employer" | "candidate") => {
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;

      if (fullName || avatarUrl) {
        await supabase
          .from("users")
          .update({ full_name: fullName || null, avatar_url: avatarUrl || null, role })
          .eq("id", uid);
      } else {
        await supabase.from("users").update({ role }).eq("id", uid);
      }

      toast.success(`Selected ${role} role`);
      onRoleSelected(role);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Hi, {fullName ? `, ${fullName}` : ""}!</h2>
        <p className="text-sm text-muted-foreground">Choose how you'll use WeAssist. You can update details later.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button disabled={saving} onClick={() => void saveCoreProfile("employer")} className="h-24 text-base flex flex-col items-center justify-center gap-2">
          <Briefcase className="h-6 w-6" />
          <span className="font-medium">I’m an Employer</span>
          <span className="text-xs text-muted-foreground">Post jobs and manage applicants</span>
        </Button>
        <Button disabled={saving} onClick={() => void saveCoreProfile("candidate")} variant="outline" className="h-24 text-base flex flex-col items-center justify-center gap-2">
          <User2 className="h-6 w-6" />
          <span className="font-medium">I’m a Candidate</span>
          <span className="text-xs text-muted-foreground">Find roles and apply quickly</span>
        </Button>
      </div>
    </motion.div>
  );
}


