"use client";

import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text";
import { Plus, Trash } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type ExperienceItem = {
  company: string;
  position: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current?: boolean;
  description?: string; // HTML from RichTextEditor
};

export type EducationItem = {
  institution: string;
  degree: string;
  field: string;
  location?: string;
  start_date?: string;
  graduation_date: string;
  gpa?: string;
  gpa_scale?: string;
  gpa_type?: 'gpa' | 'percentage';
  coursework?: string; // HTML from RichTextEditor
};

export type ProjectItem = {
  project_name: string;
  description?: string; // HTML from RichTextEditor
  project_link?: string;
  github_link?: string;
  start_date?: string;
  end_date?: string;
  date?: string; // Single date field for projects
};

export type ActivityItem = {
  name: string;
  description?: string; // HTML from RichTextEditor
  date?: string;
};

export type ResumeData = {
  fullName: string;
  full_name: string;
  summary: string; // HTML
  location: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  skills: string; // comma separated input
  languages?: string; // comma separated input
  certifications?: string; // comma separated input
  volunteer_experience?: string;
  interests_hobbies?: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
  activities?: ActivityItem[];
};

export function ResumeForm({ value, onChange }: { value: ResumeData; onChange: (patch: Partial<ResumeData>) => void }) {
  const stepMeta = [
    { key: "profile", title: "Profile" },
    { key: "education", title: "Education & Skills" },
    { key: "experience", title: "Experience" },
    { key: "projects", title: "Projects" },
    { key: "activities", title: "Activities & Additional" },
  ] as const;
  const [currentStep, setCurrentStep] = React.useState<0 | 1 | 2 | 3 | 4>(0);

  const canGoNext = () => {
    if (currentStep === 0) return Boolean(value.fullName && value.fullName.trim().length > 0);
    return true;
  };
  const addExperience = useCallback(() => {
    onChange({ experience: [...value.experience, { company: "", position: "", location: "", start_date: "", description: "" }] });
  }, [onChange, value.experience]);

  const removeExperience = useCallback(
    (idx: number) => {
      onChange({ experience: value.experience.filter((_, i) => i !== idx) });
    },
    [onChange, value.experience],
  );

  const updateExperience = useCallback(
    (idx: number, patch: Partial<ExperienceItem>) => {
      onChange({ experience: value.experience.map((it, i) => (i === idx ? { ...it, ...patch } : it)) });
    },
    [onChange, value.experience],
  );

  const addEducation = useCallback(() => {
    onChange({ education: [...value.education, { institution: "", degree: "", field: "", location: "", start_date: "", graduation_date: "", gpa: "", gpa_scale: "", gpa_type: "gpa", coursework: "" }] });
  }, [onChange, value.education]);

  const removeEducation = useCallback(
    (idx: number) => {
      onChange({ education: value.education.filter((_, i) => i !== idx) });
    },
    [onChange, value.education],
  );

  const updateEducation = useCallback(
    (idx: number, patch: Partial<EducationItem>) => {
      onChange({ education: value.education.map((it, i) => (i === idx ? { ...it, ...patch } : it)) });
    },
    [onChange, value.education],
  );

  const addProject = useCallback(() => {
    onChange({ projects: [...value.projects, { project_name: "", description: "", date: "" }] });
  }, [onChange, value.projects]);

  const addActivity = useCallback(() => {
    const newActivities = [...(value.activities || []), { name: "", description: "", date: "" }];
    onChange({ activities: newActivities });
  }, [onChange, value.activities]);

  const removeActivity = useCallback(
    (idx: number) => {
      onChange({ activities: (value.activities || []).filter((_, i) => i !== idx) });
    },
    [onChange, value.activities],
  );

  const updateActivity = useCallback(
    (idx: number, patch: Partial<ActivityItem>) => {
      onChange({ activities: (value.activities || []).map((it, i) => (i === idx ? { ...it, ...patch } : it)) });
    },
    [onChange, value.activities],
  );

  const removeProject = useCallback(
    (idx: number) => {
      onChange({ projects: value.projects.filter((_, i) => i !== idx) });
    },
    [onChange, value.projects],
  );

  const updateProject = useCallback(
    (idx: number, patch: Partial<ProjectItem>) => {
      onChange({ projects: value.projects.map((it, i) => (i === idx ? { ...it, ...patch } : it)) });
    },
    [onChange, value.projects],
  );

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 w-full">
            {stepMeta.map((step, idx) => (
              <div key={step.key} className="flex items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setCurrentStep(idx as 0 | 1 | 2 | 3 | 4)}
                  className={`h-10 px-2 rounded-md border text-sm flex items-center gap-2 transition-colors ${
                    currentStep === idx
                      ? "bg-primary/10 text-foreground border-primary"
                      : idx < currentStep
                      ? "bg-muted text-foreground border-border"
                      : "bg-background text-muted-foreground border-border hover:bg-muted/50"
                  }`}
                >
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs ${idx <= currentStep ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border"}`}>
                    {idx + 1}
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

      {currentStep === 0 && (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={value.fullName || value.full_name} onChange={(e) => onChange({ fullName: e.target.value, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={value.location} onChange={(e) => onChange({ location: e.target.value })} placeholder="City, Country" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={value.email || ""} onChange={(e) => onChange({ email: e.target.value })} placeholder="your@email.com" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input type="tel" value={value.phone || ""} onChange={(e) => onChange({ phone: e.target.value })} placeholder="+1-234-567-8900" />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input value={value.linkedin || ""} onChange={(e) => onChange({ linkedin: e.target.value })} placeholder="linkedin.com/in/yourprofile" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Professional summary</Label>
            <RichTextEditor value={value.summary} onChange={(html) => onChange({ summary: html })} placeholder="Brief overview about you" />
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Skills (comma separated)</Label>
            <Textarea value={Array.isArray((value as any).skills) ? (value as any).skills.join(", ") : (value.skills || "")} onChange={(e) => onChange({ skills: e.target.value })} placeholder="React, TypeScript, SQL" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Education</Label>
              <Button type="button" variant="outline" size="sm" onClick={addEducation}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {value.education.map((ed, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-md border p-4 space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input placeholder="Institution" value={ed.institution} onChange={(e) => updateEducation(idx, { institution: e.target.value })} />
                  <Input placeholder="Degree" value={ed.degree} onChange={(e) => updateEducation(idx, { degree: e.target.value })} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input placeholder="Field of Study" value={ed.field} onChange={(e) => updateEducation(idx, { field: e.target.value })} />
                  <Input placeholder="Location" value={ed.location || ""} onChange={(e) => updateEducation(idx, { location: e.target.value })} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Start Date</Label>
                    <Input type="date" value={ed.start_date || ""} onChange={(e) => updateEducation(idx, { start_date: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Graduation Date</Label>
                    <Input type="date" value={ed.graduation_date} onChange={(e) => updateEducation(idx, { graduation_date: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-3">
                  <RadioGroup value={ed.gpa_type || "gpa"} onValueChange={(value) => updateEducation(idx, { gpa_type: value as 'gpa' | 'percentage' })}>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="gpa" id={`gpa-${idx}`} />
                        <Label htmlFor={`gpa-${idx}`} className="text-sm">GPA</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="percentage" id={`percentage-${idx}`} />
                        <Label htmlFor={`percentage-${idx}`} className="text-sm">Percentage</Label>
                      </div>
                    </div>
                  </RadioGroup>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input 
                      placeholder={ed.gpa_type === "percentage" ? "Percentage (e.g., 85%)" : "GPA (e.g., 3.8)"} 
                      value={ed.gpa || ""} 
                      onChange={(e) => updateEducation(idx, { gpa: e.target.value })} 
                    />
                    {ed.gpa_type !== "percentage" && (
                      <Input 
                        placeholder="Scale (e.g., 4.0)" 
                        value={ed.gpa_scale || ""} 
                        onChange={(e) => updateEducation(idx, { gpa_scale: e.target.value })} 
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Relevant Coursework</Label>
                  <RichTextEditor value={ed.coursework || ""} onChange={(html) => updateEducation(idx, { coursework: html })} placeholder="List relevant courses" />
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Experience</Label>
            <Button type="button" variant="outline" size="sm" onClick={addExperience}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          {value.experience.map((exp, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-md border p-4 space-y-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input placeholder="Company" value={exp.company} onChange={(e) => updateExperience(idx, { company: e.target.value })} />
                <Input placeholder="Position" value={exp.position} onChange={(e) => updateExperience(idx, { position: e.target.value })} />
              </div>
              <Input placeholder="Location" value={exp.location || ""} onChange={(e) => updateExperience(idx, { location: e.target.value })} />
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id={`current-${idx}`}
                    checked={exp.is_current || false}
                    onCheckedChange={(checked) => {
                      updateExperience(idx, { is_current: checked, end_date: checked ? "" : exp.end_date });
                    }}
                  />
                  <Label htmlFor={`current-${idx}`} className="text-sm">Currently working here</Label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Start Date</Label>
                    <Input type="date" value={exp.start_date} onChange={(e) => updateExperience(idx, { start_date: e.target.value })} />
                  </div>
                  {!exp.is_current && (
                    <div className="space-y-2">
                      <Label className="text-xs">End Date</Label>
                      <Input type="date" value={exp.end_date || ""} onChange={(e) => updateExperience(idx, { end_date: e.target.value })} />
                    </div>
                  )}
                </div>
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
      )}

      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Projects</Label>
            <Button type="button" variant="outline" size="sm" onClick={addProject}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          {value.projects.map((pr, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-md border p-4 space-y-3">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input placeholder="Project name" value={pr.project_name} onChange={(e) => updateProject(idx, { project_name: e.target.value })} />
                <Input type="date" placeholder="Date" value={pr.date || ""} onChange={(e) => updateProject(idx, { date: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input placeholder="Project link (optional)" value={pr.project_link || ""} onChange={(e) => updateProject(idx, { project_link: e.target.value })} />
                <Input placeholder="GitHub link (optional)" value={pr.github_link || ""} onChange={(e) => updateProject(idx, { github_link: e.target.value })} />
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
      )}

      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Activities</Label>
              <Button type="button" variant="outline" size="sm" onClick={addActivity}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
            {(value.activities || []).map((act, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-md border p-4 space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input placeholder="Activity name" value={act.name} onChange={(e) => updateActivity(idx, { name: e.target.value })} />
                  <Input type="date" placeholder="Date" value={act.date || ""} onChange={(e) => updateActivity(idx, { date: e.target.value })} />
                </div>
                <RichTextEditor value={act.description || ""} onChange={(html) => updateActivity(idx, { description: html })} placeholder="Describe your activity" />
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeActivity(idx)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Additional Information</h3>
            <div className="space-y-2">
              <Label>Languages (comma separated)</Label>
              <Textarea value={Array.isArray((value as any).languages) ? (value as any).languages.join(", ") : (value.languages || "")} onChange={(e) => onChange({ languages: e.target.value })} placeholder="English (fluent), Spanish (proficient)" />
            </div>
            <div className="space-y-2">
              <Label>Certifications (comma separated)</Label>
              <Textarea value={Array.isArray((value as any).certifications) ? (value as any).certifications.join(", ") : (value.certifications || "")} onChange={(e) => onChange({ certifications: e.target.value })} placeholder="Professional Engineer (PE), Certified Energy Manager (CEM)" />
            </div>
            <div className="space-y-2">
              <Label>Volunteer Experience</Label>
              <Textarea value={value.volunteer_experience || ""} onChange={(e) => onChange({ volunteer_experience: e.target.value })} placeholder="Describe your volunteer work" />
            </div>
            <div className="space-y-2">
              <Label>Interests/Hobbies</Label>
              <Textarea value={value.interests_hobbies || ""} onChange={(e) => onChange({ interests_hobbies: e.target.value })} placeholder="Your interests and hobbies" />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="outline" disabled={currentStep === 0} onClick={() => setCurrentStep((s) => (s > 0 ? ((s - 1) as 0 | 1 | 2 | 3 | 4) : s))}>
          Previous
        </Button>
        <Button type="button" disabled={!canGoNext()} onClick={() => setCurrentStep((s) => (s < 4 ? ((s + 1) as 0 | 1 | 2 | 3 | 4) : s))}>
          {currentStep < 4 ? "Next" : "Done"}
        </Button>
      </div>
    </div>
  );
}


