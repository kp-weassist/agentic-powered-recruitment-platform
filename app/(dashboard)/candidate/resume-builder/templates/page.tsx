"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";
import { ResumeForm, type ResumeData } from "../_components/resume-form";
import ClassicPreview from "../templates/classic/preview";
import ModernPreview from "../templates/modern/preview";
import ClassicPdf from "../templates/classic/pdf";
import ModernPdf from "../templates/modern/pdf";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import TraditionalPreview from "../templates/traditional/preview";
import TraditionalPdf from "../templates/traditional/pdf";

type TemplateKey = "classic" | "modern" | "traditional";

function ResumeBuilder() {
  const supabase = createClient();
  const params = useSearchParams();
  const router = useRouter();
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [template, setTemplate] = useState<TemplateKey>("classic");
  const [data, setData] = useState<ResumeData>({
    fullName: "",
    full_name: "",
    summary: "",
    location: "",
    email: "",
    phone: "",
    linkedin: "",
    skills: "",
    languages: "",
    certifications: "",
    volunteer_experience: "",
    interests_hobbies: "",
    experience: [],
    education: [],
    projects: [],
    activities: [],
  });
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [pendingSaveAction, setPendingSaveAction] = useState<{ openAfter: boolean } | null>(null);

  const Preview = useMemo(() => (template === "classic" ? ClassicPreview : (template === "modern" ? ModernPreview : TraditionalPreview)), [template]);
  const PdfDoc = useMemo(() => (template === "classic" ? ClassicPdf : (template === "modern" ? ModernPdf : TraditionalPdf)), [template]);

  useEffect(() => {
    const sourceResumeId = params.get("resumeId");
    const sourceUrl = params.get("url");
    const scratch = params.get("scratch");
    
    const prefill = async () => {
      setLoading(true);
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) return;
        
        // If scratch mode, just return
        if (scratch) {
          setCurrentResumeId(null);
          return;
        }
        
        // If specific resume ID provided, load that
        if (sourceResumeId) {
          setCurrentResumeId(sourceResumeId);
          const { data: row, error } = await supabase
            .from("resumes")
            .select("id,file_url,resume_data")
            .eq("user_id", uid)
            .eq("is_deleted", false)
            .eq("id", sourceResumeId)
            .maybeSingle();
          if (error) throw error;
          if (!row) return;
          if (row.resume_data) {
            const resumeData = row.resume_data as ResumeData & { skills?: string | string[]; languages?: string | string[]; certifications?: string | string[] };
            setData({
              fullName: resumeData.fullName || resumeData.full_name || "",
              full_name: resumeData.full_name || resumeData.fullName || "",
              summary: resumeData.summary || "",
              location: resumeData.location || "",
              email: resumeData.email || "",
              phone: resumeData.phone || "",
              linkedin: resumeData.linkedin || "",
              skills: Array.isArray(resumeData.skills) ? resumeData.skills.join(", ") : (resumeData.skills || ""),
              languages: Array.isArray(resumeData.languages) ? resumeData.languages.join(", ") : (resumeData.languages || ""),
              certifications: Array.isArray(resumeData.certifications) ? resumeData.certifications.join(", ") : (resumeData.certifications || ""),
              volunteer_experience: resumeData.volunteer_experience || "",
              interests_hobbies: resumeData.interests_hobbies || "",
              experience: resumeData.experience || [],
              education: resumeData.education || [],
              projects: resumeData.projects || [],
              activities: resumeData.activities || [],
            });
            return;
          }
          if (row.file_url) {
            await parseAndPopulate(row.file_url);
          }
          return;
        }
        
        // If URL provided, parse and populate
        if (sourceUrl) {
          await parseAndPopulate(sourceUrl);
          return;
        }
        
        // Otherwise, load the most recent resume with data
        const { data: mostRecent, error } = await supabase
          .from("resumes")
          .select("id,file_url,resume_data")
          .eq("user_id", uid)
          .eq("is_deleted", false)
          .not("resume_data", "is", null)
          .order("uploaded_at", { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (!error && mostRecent && mostRecent.resume_data) {
          const resumeData = mostRecent.resume_data as ResumeData & { skills?: string | string[]; languages?: string | string[]; certifications?: string | string[] };
          setData({
            fullName: resumeData.fullName || resumeData.full_name || "",
            full_name: resumeData.full_name || resumeData.fullName || "",
            summary: resumeData.summary || "",
            location: resumeData.location || "",
            email: resumeData.email || "",
            phone: resumeData.phone || "",
            linkedin: resumeData.linkedin || "",
            skills: Array.isArray(resumeData.skills) ? resumeData.skills.join(", ") : (resumeData.skills || ""),
            languages: Array.isArray(resumeData.languages) ? resumeData.languages.join(", ") : (resumeData.languages || ""),
            certifications: Array.isArray(resumeData.certifications) ? resumeData.certifications.join(", ") : (resumeData.certifications || ""),
            volunteer_experience: resumeData.volunteer_experience || "",
            interests_hobbies: resumeData.interests_hobbies || "",
            experience: resumeData.experience || [],
            education: resumeData.education || [],
            projects: resumeData.projects || [],
            activities: resumeData.activities || [],
          });
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to prefill";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    void prefill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const parseAndPopulate = async (resumeUrl: string) => {
    try {
      const parseRes = await fetch("/api/pdf-parser", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: resumeUrl }),
      });
      const parseJson = (await parseRes.json()) as { text?: string; error?: string };
      if (!parseRes.ok || !parseJson.text) throw new Error(parseJson.error || "Failed to parse PDF");

      const extractRes = await fetch("/api/resume-extractor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: parseJson.text, resumeUrl }),
      });
      const extractJson = (await extractRes.json()) as { data?: any; error?: string };
      if (!extractRes.ok || !extractJson.data) throw new Error(extractJson.error || "Failed to extract data");

      const d = extractJson.data as any;
      
      // Map projects with proper field names
      const mappedProjects = Array.isArray(d.projects) ? d.projects.map((p: any) => ({
        project_name: p.project_name || "",
        description: p.description || "",
        date: p.date || "",
        project_link: p.project_link || p.projectLink || "",
        github_link: p.github_link || p.githubLink || ""
      })) : [];

      // Map education with proper field names including start_date
      const mappedEducation = Array.isArray(d.education) ? d.education.map((e: any) => ({
        institution: e.institution || "",
        degree: e.degree || "",
        field: e.field || "",
        location: e.location || "",
        start_date: e.start_date || "",
        graduation_date: e.graduation_date || e.graduationDate || "",
        gpa: e.gpa || "",
        gpa_scale: e.gpa_scale || "",
        gpa_type: e.gpa_type || "gpa",
        coursework: e.coursework || ""
      })) : [];

      // Map experience with is_current field
      const mappedExperience = Array.isArray(d.experience) ? d.experience.map((e: any) => ({
        company: e.company || "",
        position: e.position || "",
        location: e.location || "",
        start_date: e.start_date || "",
        end_date: e.end_date || e.endDate || "",
        is_current: e.is_current || false,
        description: e.description || ""
      })) : [];

      setData({
        fullName: d.full_name || d.fullName || "",
        full_name: d.full_name || d.fullName || "",
        summary: d.summary || "",
        location: typeof d.location === "string" ? d.location : "",
        email: d.email || "",
        phone: d.phone || "",
        linkedin: d.linkedin || d.linkedinUrl || "",
        skills: Array.isArray(d.skills) ? d.skills.join(", ") : (d.skills || ""),
        languages: Array.isArray(d.languages) ? d.languages.join(", ") : (d.languages || ""),
        certifications: Array.isArray(d.certifications) ? d.certifications.join(", ") : (d.certifications || ""),
        volunteer_experience: d.volunteer_experience || "",
        interests_hobbies: d.interests_hobbies || "",
        experience: mappedExperience.length > 0 ? mappedExperience : [],
        education: mappedEducation.length > 0 ? mappedEducation : [],
        projects: mappedProjects.length > 0 ? mappedProjects : [],
        activities: Array.isArray(d.activities) ? d.activities : [],
      });
      console.log("Final data", data);
      toast.success("Form populated from resume");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to extract";
      toast.error(message);
    }
  };

  const handleSaveAsNewClick = (openAfter: boolean) => {
    const defaultName = `${template}-resume-${new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit', 
      year: 'numeric' 
    }).replace(/[/,]/g, '-')}`;
    setNewFileName(defaultName);
    setPendingSaveAction({ openAfter });
    setShowSaveDialog(true);
  };

  const confirmSaveAsNew = async () => {
    if (!newFileName.trim()) {
      toast.error("Please enter a file name");
      return;
    }
    setShowSaveDialog(false);
    const openAfter = pendingSaveAction?.openAfter ?? false;
    const randomId = Math.random().toString(10).substring(2, 15);
    await saveOrExport(openAfter, true, newFileName.trim() + "-" + randomId);
    setPendingSaveAction(null);
    setNewFileName("");
  };

  const saveOrExport = async (openAfter = true, saveAsNew = false, customFileName?: string) => {
    try {
      const blob = await pdf(<PdfDoc data={data} />).toBlob();

      // Attempt to persist to Supabase; fallback to open locally
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (uid) {
        const fileName = customFileName 
          ? `${customFileName}${customFileName.endsWith('.pdf') ? '' : '.pdf'}`
          : `${template}-resume-${Date.now()}.pdf`;
        const path = `${uid}/generated/${fileName}`;
        const { error: uploadErr } = await supabase.storage.from("resume").upload(path, blob, {
          cacheControl: "3600",
          contentType: "application/pdf",
          upsert: true,
        });
        if (uploadErr) throw uploadErr;

        const { data: pub } = supabase.storage.from("resume").getPublicUrl(path);
        const fileUrl = pub.publicUrl;

        let resumeId = currentResumeId;
        
        // Check if we should update existing or create new
        if (!saveAsNew && currentResumeId) {
          // Update existing resume
          const { error: updateErr } = await supabase
            .from("resumes")
            .update({ 
              file_name: fileName, 
              file_url: fileUrl, 
              storage_path: path, 
              resume_data: data 
            })
            .eq("id", currentResumeId)
            .eq("user_id", uid);
            
          if (updateErr) throw updateErr;
        } else {
          // Create new resume
          const { data: newResume, error: insertErr } = await supabase
            .from("resumes")
            .insert({ 
              user_id: uid, 
              file_name: fileName, 
              file_url: fileUrl, 
              storage_path: path, 
              resume_data: data 
            })
            .select("id")
            .single();
            
          if (insertErr) throw insertErr;
          resumeId = newResume.id;
          
          // Update URL if we created a new resume
          if (resumeId && resumeId !== currentResumeId) {
            setCurrentResumeId(resumeId);
            // Update URL without reloading the page
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set("resumeId", resumeId);
            router.replace(newUrl.pathname + newUrl.search);
          }
        }

        console.log("Saved data", data);

        if (openAfter) window.open(fileUrl, "_blank");
        const action = saveAsNew ? "saved as new" : (currentResumeId ? "updated" : "saved");
        toast.success(openAfter ? `Exported to PDF and ${action}` : `Resume ${action}`);
      } else {
        // Fallback: open blob URL locally
        const url = URL.createObjectURL(blob);
        if (openAfter) window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
        toast.message(openAfter ? "Exported PDF opened in a new tab" : "Resume saved locally");
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to export";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6 min-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Resume Builder</h1>
          <p className="text-muted-foreground">Create your resume and export a matching PDF.</p>
        </div>
        <Tabs value={template} onValueChange={(v) => setTemplate(v as TemplateKey)}>
          <TabsList>
            <TabsTrigger value="classic">Classic</TabsTrigger>
            <TabsTrigger value="modern">Modern</TabsTrigger>
            <TabsTrigger value="traditional">Traditional</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-8 items-start">
        <div className="rounded-lg border p-6 bg-background">
          <ResumeForm value={data} onChange={(patch) => setData((d) => ({ ...d, ...patch }))} />
        </div>
        <div className="rounded-lg border p-6 bg-background xl:sticky xl:top-20 max-h-[80vh] overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{loading ? "Loading…" : `Preview (${template})`}</p>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    Save <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => void saveOrExport(false, false)}>
                    {currentResumeId ? "Save Current" : "Save"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSaveAsNewClick(false)}>
                    Save as New...
                    
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm">
                    Export to PDF <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => void saveOrExport(true, false)}>
                    {currentResumeId ? "Export & Update Current" : "Export & Save"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSaveAsNewClick(true)}>
                    Export & Save as New...
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="flex justify-center">
            <Preview data={data} />
          </div>
        </div>
      </div>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as New Resume</DialogTitle>
            <DialogDescription>
              Enter a name for your new resume file
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="filename" className="text-right">
                File Name
              </Label>
              <div className="col-span-3 flex items-center gap-1">
                <Input
                  id="filename"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="Enter file name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void confirmSaveAsNew();
                    }
                  }}
                />
                <span className="text-sm text-muted-foreground">.pdf</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => void confirmSaveAsNew()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ResumeBuilderPage() {
  return <Suspense fallback={<div>Loading...</div>}>
    <ResumeBuilder />
  </Suspense>;
}