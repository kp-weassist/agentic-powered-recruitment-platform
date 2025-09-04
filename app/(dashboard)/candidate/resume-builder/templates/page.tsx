"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";
import { ResumeForm, type ResumeData } from "../_components/resume-form";
import ClassicPreview from "../templates/classic/preview";
import ModernPreview from "../templates/modern/preview";
import ClassicPdf from "../templates/classic/pdf";
import ModernPdf from "../templates/modern/pdf";
import { useSearchParams } from "next/navigation";

type TemplateKey = "classic" | "modern";

export default function ResumeBuilderPage() {
  const supabase = createClient();
  const params = useSearchParams();
  const [template, setTemplate] = useState<TemplateKey>("classic");
  const [data, setData] = useState<ResumeData>({
    fullName: "",
    summary: "",
    location: "",
    skills: "",
    experience: [{ company: "", position: "", start_date: "", description: "" }],
    education: [{ institution: "", degree: "", field: "", graduation_date: "" }],
    projects: [{ project_name: "", description: "" }],
  });
  const [loading, setLoading] = useState(false);

  const Preview = useMemo(() => (template === "classic" ? ClassicPreview : ModernPreview), [template]);
  const PdfDoc = useMemo(() => (template === "classic" ? ClassicPdf : ModernPdf), [template]);

  useEffect(() => {
    const sourceResumeId = params.get("resumeId");
    const sourceUrl = params.get("url");
    const scratch = params.get("scratch");
    if (scratch || (!sourceResumeId && !sourceUrl)) return;
    const prefill = async () => {
      setLoading(true);
      try {
        if (sourceResumeId) {
          const { data: auth } = await supabase.auth.getUser();
          const uid = auth.user?.id;
          if (!uid) return;
          const { data: row, error } = await supabase
            .from("resumes")
            .select("id,file_url,resume_data")
            .eq("user_id", uid)
            .eq("id", sourceResumeId)
            .maybeSingle();
          if (error) throw error;
          if (!row) return;
          if (row.resume_data) {
            setData(row.resume_data as ResumeData);
            return;
          }
          if (row.file_url) {
            await parseAndPopulate(row.file_url);
          }
          return;
        }
        if (sourceUrl) {
          await parseAndPopulate(sourceUrl);
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
      setData({
        fullName: d.full_name || "",
        summary: "", // extractor returns descriptions in items; keep summary empty for now
        location: typeof d.location === "string" ? d.location : "",
        skills: Array.isArray(d.skills) ? d.skills.join(", ") : "",
        experience: Array.isArray(d.experience) ? d.experience : [],
        education: Array.isArray(d.education) ? d.education : [],
        projects: Array.isArray(d.projects) ? d.projects : [],
      });
      toast.success("Form populated from resume");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to extract";
      toast.error(message);
    }
  };

  const saveOrExport = async (openAfter = true) => {
    try {
      const blob = await pdf(<PdfDoc data={data} />).toBlob();

      // Attempt to persist to Supabase; fallback to open locally
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (uid) {
        const fileName = `${template}-resume-${Date.now()}.pdf`;
        const path = `${uid}/generated/${fileName}`;
        const { error: uploadErr } = await supabase.storage.from("resume").upload(path, blob, {
          cacheControl: "3600",
          contentType: "application/pdf",
          upsert: true,
        });
        if (uploadErr) throw uploadErr;

        const { data: pub } = supabase.storage.from("resume").getPublicUrl(path);
        const fileUrl = pub.publicUrl;

        await supabase
          .from("resumes")
          .insert({ user_id: uid, file_name: fileName, file_url: fileUrl, storage_path: path, resume_data: data })
          .select("id")
          .single();

        if (openAfter) window.open(fileUrl, "_blank");
        toast.success(openAfter ? "Exported to PDF and saved to your account" : "Resume saved");
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
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-8 xl:grid-cols-2 items-start">
        <div className="rounded-lg border p-6 bg-background">
          <ResumeForm value={data} onChange={(patch) => setData((d) => ({ ...d, ...patch }))} />
        </div>
        <div className="rounded-lg border p-6 bg-background xl:sticky xl:top-20 max-h-[80vh] overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{loading ? "Loading…" : `Preview (${template})`}</p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => void saveOrExport(false)}>Save</Button>
              <Button size="sm" onClick={() => void saveOrExport(true)}>Export to PDF</Button>
            </div>
          </div>
          <div className="flex justify-center">
            <Preview data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}

