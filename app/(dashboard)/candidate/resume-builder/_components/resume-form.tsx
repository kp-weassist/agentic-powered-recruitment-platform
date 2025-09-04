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

export type ExperienceItem = {
  company: string;
  position: string;
  start_date: string;
  end_date?: string;
  description?: string; // HTML from RichTextEditor
};

export type EducationItem = {
  institution: string;
  degree: string;
  field: string;
  graduation_date: string;
};

export type ProjectItem = {
  project_name: string;
  description?: string; // HTML from RichTextEditor
  project_link?: string;
  github_link?: string;
  start_date?: string;
  end_date?: string;
};

export type ResumeData = {
  fullName: string;
  summary: string; // HTML
  location: string;
  skills: string; // comma separated input
  experience: ExperienceItem[];
  education: EducationItem[];
  projects: ProjectItem[];
};

export function ResumeForm({ value, onChange }: { value: ResumeData; onChange: (patch: Partial<ResumeData>) => void }) {
  const stepMeta = [
    { key: "profile", title: "Profile" },
    { key: "education", title: "Education & Skills" },
    { key: "experience", title: "Experience" },
    { key: "projects", title: "Projects" },
  ] as const;
  const [currentStep, setCurrentStep] = React.useState<0 | 1 | 2 | 3>(0);

  const canGoNext = () => {
    if (currentStep === 0) return Boolean(value.fullName && value.fullName.trim().length > 0);
    return true;
  };
  const addExperience = useCallback(() => {
    onChange({ experience: [...value.experience, { company: "", position: "", start_date: "", description: "" }] });
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
    onChange({ education: [...value.education, { institution: "", degree: "", field: "", graduation_date: "" }] });
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
    onChange({ projects: [...value.projects, { project_name: "", description: "" }] });
  }, [onChange, value.projects]);

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
                  onClick={() => setCurrentStep(idx as 0 | 1 | 2 | 3)}
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
              <Input value={value.fullName} onChange={(e) => onChange({ fullName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={value.location} onChange={(e) => onChange({ location: e.target.value })} placeholder="City, Country" />
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
            <Textarea value={value.skills} onChange={(e) => onChange({ skills: e.target.value })} placeholder="React, TypeScript, SQL" />
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
              <div className="grid gap-4 sm:grid-cols-2">
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
              <Input placeholder="Project name" value={pr.project_name} onChange={(e) => updateProject(idx, { project_name: e.target.value })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input placeholder="Project link (optional)" value={pr.project_link || ""} onChange={(e) => updateProject(idx, { project_link: e.target.value })} />
                <Input placeholder="GitHub link (optional)" value={pr.github_link || ""} onChange={(e) => updateProject(idx, { github_link: e.target.value })} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
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
      )}

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="outline" disabled={currentStep === 0} onClick={() => setCurrentStep((s) => (s > 0 ? ((s - 1) as 0 | 1 | 2 | 3) : s))}>
          Previous
        </Button>
        <Button type="button" disabled={!canGoNext()} onClick={() => setCurrentStep((s) => (s < 3 ? ((s + 1) as 0 | 1 | 2 | 3) : s))}>
          {currentStep < 3 ? "Next" : "Done"}
        </Button>
      </div>
    </div>
  );
}


