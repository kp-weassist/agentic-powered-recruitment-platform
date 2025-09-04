"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text";
import { FileUpload } from "@/components/upload/file-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const supabase = useMemo(() => createClient(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [accountFullName, setAccountFullName] = useState("");
  const [accountAvatarUrl, setAccountAvatarUrl] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id || null;
        setUserId(uid);
        if (!uid) return;

        const { data: userRow } = await supabase
          .from("users")
          .select("full_name,avatar_url")
          .eq("id", uid)
          .maybeSingle();
        if (userRow) {
          setAccountFullName(userRow.full_name ?? "");
          setAccountAvatarUrl(userRow.avatar_url ?? "");
        }

        const { data: profile } = await supabase
          .from("employer_profiles")
          .select("company_name,company_size,industry,logo_url,website,description")
          .eq("user_id", uid)
          .maybeSingle();
        if (profile) {
          setCompanyName(profile.company_name ?? "");
          setCompanySize(profile.company_size ?? "");
          setIndustry(profile.industry ?? "");
          setLogoUrl(profile.logo_url ?? "");
          setWebsite(profile.website ?? "");
          setDescription(profile.description ?? "");
        }
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [supabase]);

  const saveAll = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const { error: userErr } = await supabase
        .from("users")
        .update({ full_name: accountFullName || null, avatar_url: accountAvatarUrl || null, is_onboarding_completed: true })
        .eq("id", userId);
      if (userErr) throw userErr;

      const { error: empErr } = await supabase.from("employer_profiles").upsert(
        {
          user_id: userId,
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
      toast.success("Profile saved");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const uploadAvatar = async (url: string) => {
    setAccountAvatarUrl(url);
    try {
      if (!userId) return;
      const { error } = await supabase.from("users").update({ avatar_url: url }).eq("id", userId);
      if (error) throw error;
    } catch {
      /* ignore */
    }
  };

  const uploadLogo = async (url: string) => {
    setLogoUrl(url);
    try {
      if (!userId || !companyName) return; // require company name for upsert
      const { error } = await supabase.from("employer_profiles").upsert({ user_id: userId, company_name: companyName, logo_url: url }, { onConflict: "user_id" });
      if (error) throw error;
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        className="flex items-start justify-between gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Employer profile</h1>
          <p className="text-sm text-muted-foreground">Tell candidates about your company.</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button onClick={() => void saveAll()} disabled={isSaving || isLoading}>{isSaving ? "Saving..." : "Save changes"}</Button>
          </motion.div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div layout className="lg:col-span-1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader className="flex items-center justify-center flex-col">
            <CardTitle>Account</CardTitle>
            <CardDescription>Basic user information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 justify-center">
              {/* {isLoading ? (
                <Skeleton className="h-16 w-16 rounded-full" />
              ) : (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={accountAvatarUrl || undefined} />
                    <AvatarFallback>{(accountFullName?.[0] || "U").toUpperCase()}</AvatarFallback>
                  </Avatar>
                </motion.div>
              )} */}
              <FileUpload bucketId="avatars" accept="image/*" onUploaded={(url) => void uploadAvatar(url)} pathPrefix="avatar" />
            </div>
            <div className="space-y-2">
              <Label>Account full name</Label>
              {isLoading ? <Skeleton className="h-9 w-full" /> : <Input value={accountFullName} onChange={(e) => setAccountFullName(e.target.value)} />}
            </div>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div layout className="lg:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="flex items-center justify-center flex-col">
            <CardTitle>Company details</CardTitle>
            <CardDescription>Shown to candidates and teammates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Company name</Label>
                {isLoading ? <Skeleton className="h-9 w-full" /> : <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Inc." />}
              </div>
              <div className="space-y-2">
                <Label>Company size</Label>
                {isLoading ? <Skeleton className="h-9 w-full" /> : <Input value={companySize} onChange={(e) => setCompanySize(e.target.value)} placeholder="11-50" />}
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                {isLoading ? <Skeleton className="h-9 w-full" /> : <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Software" />}
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                {isLoading ? <Skeleton className="h-9 w-full" /> : <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />}
              </div>
            </div>
          </CardContent>
          {/* <CardFooter className="border-t justify-end">
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button onClick={() => void saveAll()} disabled={isSaving || isLoading}>{isSaving ? "Saving..." : "Save section"}</Button>
            </motion.div>
          </CardFooter> */}
        </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div layout className="lg:col-span-1" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader className="flex items-center justify-center flex-col">
            <CardTitle>Branding</CardTitle>
            <CardDescription>Logo and visual identity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 justify-center">
              {/* {isLoading ? (
                <Skeleton className="h-16 w-16 rounded-full" />
              ) : (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={logoUrl || undefined} />
                    <AvatarFallback>{(companyName?.[0] || "U").toUpperCase()}</AvatarFallback>
                  </Avatar>
                </motion.div>
              )} */}
              <FileUpload bucketId="company_logo" accept="image/*" onUploaded={(url) => void uploadLogo(url)} pathPrefix="logo" />
            </div>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div layout className="lg:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="flex items-center justify-center flex-col">
            <CardTitle>About</CardTitle>
            <CardDescription>Share your mission, benefits and tech stack.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full" /> : <RichTextEditor value={description} onChange={setDescription} placeholder="What does your company do?" />}
          </CardContent>
          {/* <CardFooter className="border-t justify-end">
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button onClick={() => void saveAll()} disabled={isSaving || isLoading}>{isSaving ? "Saving..." : "Save section"}</Button>
            </motion.div>
          </CardFooter> */}
        </Card>
        </motion.div>
      </div>
    </div>
  );
}
