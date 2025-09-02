"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/upload/file-upload";
import { RichTextEditor } from "@/components/ui/rich-text";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

type ExperienceItem = { company: string; position: string; start_date: string; end_date?: string; description?: string };
type EducationItem = { institution: string; degree: string; field: string; graduation_date: string };
type ProjectItem = { project_name: string; description?: string; project_link?: string; github_link?: string; start_date?: string; end_date?: string };

export function CandidateForm({
  initialUserFullName,
  initialUserAvatarUrl,
  onCompleted,
}: {
  initialUserFullName: string;
  initialUserAvatarUrl: string;
  onCompleted: () => void;
}) {
  const supabase = createClient();
  const [fullName, setFullName] = useState(initialUserFullName ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initialUserAvatarUrl ?? "");
  const [resumeUrl, setResumeUrl] = useState("");
  const [skills, setSkills] = useState<string>("");
  const [experience, setExperience] = useState<ExperienceItem[]>([
    { company: "", position: "", start_date: "", description: "" },
  ]);
  const [education, setEducation] = useState<EducationItem[]>([
    { institution: "", degree: "", field: "", graduation_date: "" },
  ]);
  const [projects, setProjects] = useState<ProjectItem[]>([
    { project_name: "", description: "" },
  ]);
  const [location, setLocation] = useState("");
  const [desiredSalary, setDesiredSalary] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3>(0);

  const stepMeta = [
    { key: "profile", title: "Profile" },
    { key: "details", title: "Details" },
    { key: "experience", title: "Experience" },
    { key: "projects", title: "Projects" },
  ] as const;

  const canGoNext = () => {
    if (currentStep === 0) {
      return Boolean(fullName && fullName.trim().length > 0);
    }
    return true;
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        if (currentStep < 3 && canGoNext() && !saving) setCurrentStep((s) => ((s + 1) as 0 | 1 | 2 | 3));
      }
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        if (currentStep > 0 && !saving) setCurrentStep((s) => ((s - 1) as 0 | 1 | 2 | 3));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentStep, saving]);

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
        if (!fullName && userRow.full_name) setFullName(userRow.full_name);
        if (!avatarUrl && userRow.avatar_url) setAvatarUrl(userRow.avatar_url);
      }
      const { data } = await supabase
        .from("candidate_profiles")
        .select("full_name,resume_url,skills,experience,education,projects,location,desired_salary")
        .eq("user_id", uid)
        .maybeSingle();
      if (data) {
        setFullName(data.full_name ?? "");
        setResumeUrl(data.resume_url ?? "");
        setSkills((data.skills || []).join(", "));
        if (Array.isArray(data.experience) && data.experience.length > 0) {
          setExperience(data.experience as ExperienceItem[]);
        }
        if (Array.isArray(data.education) && data.education.length > 0) {
          setEducation(data.education as EducationItem[]);
        }
        if (Array.isArray(data.projects) && data.projects.length > 0) {
          setProjects(data.projects as ProjectItem[]);
        }
        setLocation(data.location ?? "");
        setDesiredSalary(data.desired_salary ? String(data.desired_salary) : "");
      }
    };
    void loadExisting();
  }, [supabase]);

  const uploadAvatarCb = async (url: string) => {
    setAvatarUrl(url);
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
  const uploadResumeCb = async (url: string) => {
    setResumeUrl(url);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      let nameToUse = fullName;
      if (!nameToUse) {
        const { data: userRow } = await supabase.from("users").select("full_name").eq("id", uid).maybeSingle();
        nameToUse = userRow?.full_name || "";
      }
      if (!nameToUse) return; // cannot upsert due to NOT NULL constraint
      const { error } = await supabase.from("candidate_profiles").upsert(
        { user_id: uid, full_name: nameToUse, resume_url: url },
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
        .update({ full_name: fullName || null, avatar_url: avatarUrl || null, is_onboarding_completed: true })
        .eq("id", uid);
      if (userErr) throw userErr;

      // upsert candidate profile
      const { error: candErr } = await supabase.from("candidate_profiles").upsert(
        {
          user_id: uid,
          full_name: fullName,
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
      if (candErr) throw candErr;
      toast.success("Candidate profile saved");
      onCompleted();
    } finally {
      setSaving(false);
    }
  };

  const addExperience = () => setExperience((arr) => [...arr, { company: "", position: "", start_date: "", description: "" }]);
  const removeExperience = (idx: number) => setExperience((arr) => arr.filter((_, i) => i !== idx));
  const updateExperience = (idx: number, patch: Partial<ExperienceItem>) =>
    setExperience((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const addEducation = () => setEducation((arr) => [...arr, { institution: "", degree: "", field: "", graduation_date: "" }]);
  const removeEducation = (idx: number) => setEducation((arr) => arr.filter((_, i) => i !== idx));
  const updateEducation = (idx: number, patch: Partial<EducationItem>) =>
    setEducation((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const addProject = () => setProjects((arr) => [...arr, { project_name: "", description: "" }]);
  const removeProject = (idx: number) => setProjects((arr) => arr.filter((_, i) => i !== idx));
  const updateProject = (idx: number, patch: Partial<ProjectItem>) =>
    setProjects((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="space-y-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 w-full">
            {stepMeta.map((step, idx) => (
              <div key={step.key} className="flex items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setCurrentStep(idx as 0 | 1 | 2 | 3)}
                  className={`h-10 px-3 rounded-md border text-sm flex items-center gap-2 transition-colors ${
                    currentStep === idx
                      ? "bg-primary/10 text-foreground border-primary"
                      : idx < currentStep
                      ? "bg-muted text-foreground border-border"
                      : "bg-background text-muted-foreground border-border hover:bg-muted/50"
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                      idx <= currentStep ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border"
                    }`}
                  >
                    {idx < currentStep ? <Check className="h-3 w-3" /> : idx + 1}
                  </span>
                  <span className="hidden sm:inline">{step.title}</span>
                </button>
                {idx < stepMeta.length - 1 && <div className="h-px flex-1 bg-border" />}
              </div>
            ))}
          </div>
        </div>
        <Progress value={((currentStep + 1) / stepMeta.length) * 100} />
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{stepMeta[currentStep].title}</h2>
        <p className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {stepMeta.length}. {
            currentStep === 0 ? "Add your name, avatar and resume." :
            currentStep === 1 ? "Share your skills, location and education." :
            currentStep === 2 ? "Tell us about your work history." :
            "Highlight projects you're proud of."
          }
        </p>
      </div>

      {currentStep === 0 && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback>{fullName?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <FileUpload bucketId="avatars" accept="image/*" onUploaded={(url) => void uploadAvatarCb(url)} pathPrefix="avatar" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Resume</Label>
            <FileUpload bucketId="resume" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onUploaded={(url) => void uploadResumeCb(url)} pathPrefix="resume" />
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Skills (comma separated)</Label>
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, TypeScript, SQL" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
            </div>
            <div className="space-y-2">
              <Label>Desired salary</Label>
              <Input type="number" value={desiredSalary} onChange={(e) => setDesiredSalary(e.target.value)} placeholder="50000" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Education</Label>
              <Button type="button" variant="outline" size="sm" onClick={addEducation}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </div>
            {education.map((ed, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-md border p-3 space-y-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Institution" value={ed.institution} onChange={(e) => updateEducation(idx, { institution: e.target.value })} />
                  <Input placeholder="Degree" value={ed.degree} onChange={(e) => updateEducation(idx, { degree: e.target.value })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Field" value={ed.field} onChange={(e) => updateEducation(idx, { field: e.target.value })} />
                  <Input type="date" placeholder="Graduation date" value={ed.graduation_date} onChange={(e) => updateEducation(idx, { graduation_date: e.target.value })} />
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeEducation(idx)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Experience</Label>
              <Button type="button" variant="outline" size="sm" onClick={addExperience}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </div>
            {experience.map((exp, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-md border p-3 space-y-2">
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
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeExperience(idx)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Projects</Label>
              <Button type="button" variant="outline" size="sm" onClick={addProject}><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </div>
            {projects.map((pr, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-md border p-3 space-y-2">
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
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeProject(idx)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={currentStep === 0 || saving}
          onClick={() => setCurrentStep((s) => (s > 0 ? ((s - 1) as 0 | 1 | 2 | 3) : s))}
        >
          Previous
        </Button>
        {currentStep < 3 ? (
          <Button
            type="button"
            onClick={() => setCurrentStep((s) => (s < 3 ? ((s + 1) as 0 | 1 | 2 | 3) : s))}
            disabled={!canGoNext() || saving}
          >
            Next
          </Button>
        ) : (
          <Button disabled={saving || !fullName} onClick={() => void save()}>Continue to dashboard</Button>
        )}
      </div>
    </motion.div>
  );
}


