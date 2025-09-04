"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/upload/file-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RichTextEditor } from "@/components/ui/rich-text";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function EmployerForm({
  initialUserFullName,
  initialUserAvatarUrl,
  onCompleted,
}: {
  initialUserFullName: string;
  initialUserAvatarUrl: string;
  onCompleted: () => void;
}) {
  const supabase = createClient();
  const [userFullName, setUserFullName] = useState(initialUserFullName ?? "");
  const [userAvatarUrl, setUserAvatarUrl] = useState(initialUserAvatarUrl ?? "");
  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadExisting = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      // fetch account name/avatar from users table
      const { data: userRow } = await supabase
        .from("users")
        .select("full_name,avatar_url")
        .eq("id", uid)
        .maybeSingle();
      if (userRow) {
        if (!userFullName && userRow.full_name) setUserFullName(userRow.full_name);
        if (!userAvatarUrl && userRow.avatar_url) setUserAvatarUrl(userRow.avatar_url);
      }
      const { data } = await supabase
        .from("employer_profiles")
        .select("company_name,company_size,industry,logo_url,website,description")
        .eq("user_id", uid)
        .maybeSingle();
      if (data) {
        setCompanyName(data.company_name ?? "");
        setCompanySize(data.company_size ?? "");
        setIndustry(data.industry ?? "");
        setLogoUrl(data.logo_url ?? "");
        setWebsite(data.website ?? "");
        setDescription(data.description ?? "");
      }
    };
    void loadExisting();
  }, [supabase]);

  const uploadAvatarCb = async (url: string) => {
    setUserAvatarUrl(url);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const { error } = await supabase.from("users").update({ avatar_url: url }).eq("id", uid);
      if (error) throw error;
    } catch (e) {
      // ignore; will save on submit
    }
  };
  const uploadLogoCb = async (url: string) => {
    setLogoUrl(url);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      if (!companyName) {
        // Require company name for upsert due to NOT NULL constraint
        return;
      }
      const { error } = await supabase.from("employer_profiles").upsert(
        { user_id: uid, company_name: companyName, logo_url: url },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    } catch (e) {
      // ignore; will save on submit
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;

      // update core user
      const { error: userErr } = await supabase
        .from("users")
        .update({ full_name: userFullName || null, avatar_url: userAvatarUrl || null, is_onboarding_completed: true })
        .eq("id", uid);
      if (userErr) throw userErr;

      // upsert employer profile
      const { error: empErr } = await supabase.from("employer_profiles").upsert(
        {
          user_id: uid,
          company_name: companyName,
          company_size: companySize || null,
          industry: industry || null,
          logo_url: logoUrl || null,
          website: website || null,
          description: description || null,
        },
        { onConflict: "user_id" },
      );
      if (empErr) throw empErr;
      toast.success("Employer profile saved");
      onCompleted();
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Employer profile</h2>
        <p className="text-sm text-muted-foreground">Tell us about your company.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Account full name</Label>
          <Input value={userFullName} onChange={(e) => setUserFullName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Account avatar</Label>
          <div className="flex items-center gap-3">
                {/* <Avatar>
                  <AvatarImage src={userAvatarUrl || undefined} />
                  <AvatarFallback>{userFullName?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar> */}
            <FileUpload bucketId="avatars" accept="image/*" onUploaded={(url) => void uploadAvatarCb(url)} pathPrefix="avatar" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Company name</Label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Inc." />
        </div>
        <div className="space-y-2">
          <Label>Company size</Label>
          <Input value={companySize} onChange={(e) => setCompanySize(e.target.value)} placeholder="11-50" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Industry</Label>
          <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Software" />
        </div>
        <div className="space-y-2">
          <Label>Website</Label>
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Company logo</Label>
        {/* <div className="flex items-center gap-3"> */}
        {/* <Avatar>
              <AvatarImage src={logoUrl || undefined} />
              <AvatarFallback>{companyName?.[0]?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar> */}
        <FileUpload bucketId="company_logo" accept="image/*" onUploaded={(url) => void uploadLogoCb(url)} pathPrefix="logo" />
        {/* </div> */}
        {/* <p className="text-xs text-muted-foreground">Use a square image for best results.</p> */}
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <RichTextEditor value={description} onChange={setDescription} placeholder="What does your company do?" />
        <p className="text-xs text-muted-foreground">Share your mission and tech stack to attract candidates.</p>
      </div>

      <div className="flex justify-end">
        <Button disabled={saving || !companyName} onClick={() => void save()}>Continue to dashboard</Button>
      </div>
    </motion.div>
  );
}


