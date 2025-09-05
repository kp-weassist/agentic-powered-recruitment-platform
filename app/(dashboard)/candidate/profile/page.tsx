"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text";
import { FileUpload } from "@/components/upload/file-upload";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash, Wand2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

type ExperienceItem = { 
  company: string; 
  position: string; 
  location?: string;
  start_date: string; 
  end_date?: string; 
  is_current?: boolean;
  description?: string 
};
type EducationItem = { 
  institution: string; 
  degree: string; 
  field: string; 
  location?: string;
  start_date?: string;
  graduation_date: string;
  gpa?: string;
  gpa_scale?: string;
  gpa_type?: 'gpa' | 'percentage';
  coursework?: string;
};
type ProjectItem = { 
  project_name: string; 
  description?: string; 
  date?: string;
  project_link?: string; 
  github_link?: string; 
};

export default function ProfilePage() {
  const supabase = useMemo(() => createClient(), []);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [accountFullName, setAccountFullName] = useState("");
  const [accountAvatarUrl, setAccountAvatarUrl] = useState("");

  const [fullName, setFullName] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [skills, setSkills] = useState<string>("");
  const [location, setLocation] = useState("");
  const [desiredSalary, setDesiredSalary] = useState<string>("");
  const [experience, setExperience] = useState<ExperienceItem[]>([{ company: "", position: "", location: "", start_date: "", end_date: "", is_current: false, description: "" }]);
  const [education, setEducation] = useState<EducationItem[]>([{ institution: "", degree: "", field: "", location: "", start_date: "", graduation_date: "", gpa: "", gpa_scale: "", gpa_type: "gpa", coursework: "" }]);
  const [projects, setProjects] = useState<ProjectItem[]>([{ project_name: "", description: "", date: "", project_link: "", github_link: "" }]);

  const [extracting, setExtracting] = useState(false);

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
          if (!fullName && userRow.full_name) setFullName(userRow.full_name);
        }

        const { data: profile } = await supabase
          .from("candidate_profiles")
          .select("full_name,resume_url,skills,experience,education,projects,location,desired_salary")
          .eq("user_id", uid)
          .maybeSingle();
        if (profile) {
          setFullName(profile.full_name ?? "");
          setResumeUrl(profile.resume_url ?? "");
          setSkills(Array.isArray(profile.skills) ? profile.skills.join(", ") : "");
          if (Array.isArray(profile.experience) && profile.experience.length > 0) setExperience(profile.experience as ExperienceItem[]);
          if (Array.isArray(profile.education) && profile.education.length > 0) setEducation(profile.education as EducationItem[]);
          if (Array.isArray(profile.projects) && profile.projects.length > 0) setProjects(profile.projects as ProjectItem[]);
          setLocation(profile.location ?? "");
          setDesiredSalary(profile.desired_salary ? String(profile.desired_salary) : "");
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

      const { error: profileErr } = await supabase.from("candidate_profiles").upsert(
        {
          user_id: userId,
          full_name: fullName || accountFullName,
          resume_url: resumeUrl || null,
          skills: skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          experience,
          education,
          projects,
          location: location || null,
          desired_salary: desiredSalary ? Number(desiredSalary) : null,
        },
        { onConflict: "user_id" },
      );
      if (profileErr) throw profileErr;
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

  const uploadResume = async (url: string, path?: string) => {
    setResumeUrl(url);
    try {
      if (!userId) return;
      if (path) {
        const fileName = path.split("/").pop() || path;
        await supabase.from("resumes").insert({ user_id: userId, file_name: fileName, file_url: url, storage_path: path });
      }
      const nameToUse = fullName || accountFullName;
      if (!nameToUse) return;
      await supabase.from("candidate_profiles").upsert({ user_id: userId, full_name: nameToUse, resume_url: url }, { onConflict: "user_id" });
    } catch {
      /* ignore */
    }
  };

  const extractFromResume = async () => {
    if (!resumeUrl) {
      toast.error("Upload a resume first");
      return;
    }
    setExtracting(true);
    try {
      const parseRes = await fetch("/api/pdf-parser", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: resumeUrl }) });
      const parseJson = (await parseRes.json()) as { text?: string; error?: string };
      if (!parseRes.ok || !parseJson.text) throw new Error(parseJson.error || "Failed to parse PDF");

      const extractRes = await fetch("/api/resume-extractor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: parseJson.text, resumeUrl }) });
      const extractJson = (await extractRes.json()) as { data?: any; error?: string };
      if (!extractRes.ok || !extractJson.data) throw new Error(extractJson.error || "Failed to extract data");

      const data = extractJson.data as any;
      if (data.full_name) setFullName(data.full_name);
      if (Array.isArray(data.skills)) setSkills(data.skills.join(", "));
      if (Array.isArray(data.experience) && data.experience.length > 0) setExperience(data.experience as ExperienceItem[]);
      if (Array.isArray(data.education) && data.education.length > 0) setEducation(data.education as EducationItem[]);
      if (Array.isArray(data.projects) && data.projects.length > 0) setProjects(data.projects as ProjectItem[]);
      if (typeof data.location === "string") setLocation(data.location);
      if (typeof data.desired_salary === "number") setDesiredSalary(String(data.desired_salary));
      toast.success("Extracted details from resume");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      toast.error(message);
    } finally {
      setExtracting(false);
    }
  };

  const addExperience = () => setExperience((arr) => [...arr, { company: "", position: "", location: "", start_date: "", end_date: "", is_current: false, description: "" }]);
  const removeExperience = (idx: number) => setExperience((arr) => arr.filter((_, i) => i !== idx));
  const updateExperience = (idx: number, patch: Partial<ExperienceItem>) => setExperience((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const addEducation = () => setEducation((arr) => [...arr, { institution: "", degree: "", field: "", location: "", start_date: "", graduation_date: "", gpa: "", gpa_scale: "", gpa_type: "gpa", coursework: "" }]);
  const removeEducation = (idx: number) => setEducation((arr) => arr.filter((_, i) => i !== idx));
  const updateEducation = (idx: number, patch: Partial<EducationItem>) => setEducation((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const addProject = () => setProjects((arr) => [...arr, { project_name: "", description: "", date: "", project_link: "", github_link: "" }]);
  const removeProject = (idx: number) => setProjects((arr) => arr.filter((_, i) => i !== idx));
  const updateProject = (idx: number, patch: Partial<ProjectItem>) => setProjects((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  return (
    <div className="space-y-6">
      <motion.div
        className="flex items-start justify-between gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Candidate profile</h1>
          <p className="text-sm text-muted-foreground">Manage how employers see you across applications.</p>
        </div>
        <div className="flex items-center gap-2">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button variant="outline" onClick={() => void extractFromResume()} disabled={extracting || !resumeUrl}>{extracting ? "Extracting..." : (<><Wand2 className="h-4 w-4" /> Extract from resume</>)}</Button>
          </motion.div>
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
            <CardDescription>Basic information for your account.</CardDescription>
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
              <Label>Full name</Label>
              {isLoading ? <Skeleton className="h-9 w-full" /> : <Input value={accountFullName} onChange={(e) => setAccountFullName(e.target.value)} placeholder="Your name" />}
            </div>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div layout className="lg:col-span-2" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="flex items-center justify-center flex-col">
            <CardTitle>Candidate details</CardTitle>
            <CardDescription>Visible to employers when you apply.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Display name</Label>
                {isLoading ? <Skeleton className="h-9 w-full" /> : <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="How should we show your name?" />}
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                {isLoading ? <Skeleton className="h-9 w-full" /> : <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />}
              </div>
              <div className="space-y-2">
                <Label>Desired salary</Label>
                {isLoading ? <Skeleton className="h-9 w-full" /> : <Input type="number" value={desiredSalary} onChange={(e) => setDesiredSalary(e.target.value)} placeholder="50000" />}
              </div>
              <div className="space-y-2">
                <Label>Resume</Label>
                <FileUpload bucketId="resume" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onUploaded={(url, path) => void uploadResume(url, path)} pathPrefix="resumes" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Skills (comma separated)</Label>
              {isLoading ? <Skeleton className="h-24 w-full" /> : <Textarea value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, SQL" />}
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
      <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader className="flex items-center justify-center flex-col">
            <CardTitle className="flex items-center justify-between">Education </CardTitle>
            <CardDescription>Schools, programs and graduation dates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
          <Button size="sm" variant="outline" onClick={addEducation}><Plus className="h-4 w-4" /> Add</Button>
            <AnimatePresence initial={false}>
            {education.map((ed, idx) => (
              <motion.div
                key={`${idx}-${ed.institution}-${ed.degree}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Institution" value={ed.institution} onChange={(e) => updateEducation(idx, { institution: e.target.value })} />
                  <Input placeholder="Degree" value={ed.degree} onChange={(e) => updateEducation(idx, { degree: e.target.value })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Field" value={ed.field} onChange={(e) => updateEducation(idx, { field: e.target.value })} />
                  <Input type="date" placeholder="Graduation date" value={ed.graduation_date} onChange={(e) => updateEducation(idx, { graduation_date: e.target.value })} />
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeEducation(idx)}><Trash className="h-4 w-4" /></Button>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </CardContent>
          {/* <CardFooter className="border-t justify-end">
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button onClick={() => void saveAll()} disabled={isSaving || isLoading}>{isSaving ? "Saving..." : "Save section"}</Button>
            </motion.div>
          </CardFooter> */}
        </Card>
        </motion.div>

      <div className="">
        <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card>
          <CardHeader className="flex items-center justify-center flex-col">
            <CardTitle className="flex items-center justify-between">Experience </CardTitle>
            <CardDescription>Your work history and responsibilities.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
          <Button size="sm" variant="outline" onClick={addExperience}><Plus className="h-4 w-4" /> Add</Button>
            <AnimatePresence initial={false}>
            {experience.map((exp, idx) => (
              <motion.div
                key={`${idx}-${exp.company}-${exp.position}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Company" value={exp.company} onChange={(e) => updateExperience(idx, { company: e.target.value })} />
                  <Input placeholder="Position" value={exp.position} onChange={(e) => updateExperience(idx, { position: e.target.value })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input type="date" placeholder="Start date" value={exp.start_date} onChange={(e) => updateExperience(idx, { start_date: e.target.value })} />
                  <Input type="date" placeholder="End date" value={exp.end_date || ""} onChange={(e) => updateExperience(idx, { end_date: e.target.value })} />
                </div>
                <RichTextEditor value={exp.description || ""} onChange={(html) => updateExperience(idx, { description: html })} placeholder="Describe your work" />
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeExperience(idx)}><Trash className="h-4 w-4" /></Button>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </CardContent>
          {/* <CardFooter className="border-t justify-end">
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button onClick={() => void saveAll()} disabled={isSaving || isLoading}>{isSaving ? "Saving..." : "Save section"}</Button>
            </motion.div>
          </CardFooter> */}
        </Card>
        </motion.div>

       
      </div>

      <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card>
          <CardHeader className="flex items-center justify-center flex-col">
            <CardTitle className="flex items-center">Projects </CardTitle>
            <CardDescription>Highlight work you're proud of.</CardDescription>
           
          </CardHeader>
          
          <CardContent className="space-y-4">
          <Button size="sm" variant="outline" onClick={addProject}><Plus className="h-4 w-4 " /> Add</Button>
            <AnimatePresence initial={false}>
            {projects.map((pr, idx) => (
              <motion.div
                key={`${idx}-${pr.project_name}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border p-4 space-y-3"
              >
                <Input placeholder="Project name" value={pr.project_name} onChange={(e) => updateProject(idx, { project_name: e.target.value })} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Project link (optional)" value={pr.project_link || ""} onChange={(e) => updateProject(idx, { project_link: e.target.value })} />
                  <Input placeholder="GitHub link (optional)" value={pr.github_link || ""} onChange={(e) => updateProject(idx, { github_link: e.target.value })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input type="date" placeholder="Start date" value={pr.start_date || ""} onChange={(e) => updateProject(idx, { start_date: e.target.value })} />
                  <Input type="date" placeholder="End date" value={pr.end_date || ""} onChange={(e) => updateProject(idx, { end_date: e.target.value })} />
                </div>
                <RichTextEditor value={pr.description || ""} onChange={(html) => updateProject(idx, { description: html })} placeholder="Describe the project" />
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeProject(idx)}><Trash className="h-4 w-4" /></Button>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </CardContent>
          {/* <CardFooter className="border-t justify-end">
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button onClick={() => void saveAll()} disabled={isSaving || isLoading}>{isSaving ? "Saving..." : "Save section"}</Button>
            </motion.div>
          </CardFooter> */}
        </Card>
      </motion.div>
    </div>
  );
}
