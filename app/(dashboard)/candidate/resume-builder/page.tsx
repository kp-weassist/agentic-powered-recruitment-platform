"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/upload/file-upload";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";

type ResumeRow = { id: string; file_name: string; file_url: string; uploaded_at: string; resume_data: any | null };

export default function Page() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<"scratch" | "previous" | "upload">("scratch");
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateStep, setGenerateStep] = useState<string>("");
  const [progress, setProgress] = useState(15);
  const [selected, setSelected] = useState<ResumeRow | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) return;
        const { data, error } = await supabase
          .from("resumes")
          .select("id,file_name,file_url,uploaded_at,resume_data")
          .eq("user_id", uid)
          .order("uploaded_at", { ascending: false });
        if (error) throw error;
        setResumes(data ?? []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load resumes";
        toast.error(message);
      }
    };
    void load();
  }, [supabase]);

  // Animate progress while generating
  useEffect(() => {
    if (!generating) return;
    const id = setInterval(() => setProgress((p) => (p >= 92 ? 92 : p + Math.floor(Math.random() * 5) + 1)), 400);
    return () => clearInterval(id);
  }, [generating]);

  const startScratch = () => router.push("/candidate/resume-builder/templates?scratch=1");

  const continueWithPrevious = () => {
    if (!selectedId) return toast.error("Select a resume");
    router.push(`/candidate/resume-builder/templates?resumeId=${selectedId}`);
  };

  const handleUploaded = async (url: string, path: string) => {
    try {
      setLoading(true);
      setGenerating(true);
      setGenerateStep("Saving upload…");
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("You must be signed in");
      const fileName = path.split("/").pop() || path;
      const { data: inserted, error } = await supabase
        .from("resumes")
        .insert({ user_id: uid, file_name: fileName, file_url: url, storage_path: path })
        .select("id")
        .single();
      if (error) throw error;

      // Parse and extract JSON before navigating
      setGenerateStep("Parsing PDF…");
      const parseRes = await fetch("/api/pdf-parser", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const parse = (await parseRes.json()) as { text?: string; error?: string };
      if (!parseRes.ok || !parse.text) throw new Error(parse.error || "Failed to parse PDF");

      setGenerateStep("Extracting structured data…");
      const extractRes = await fetch("/api/resume-extractor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: parse.text, resumeUrl: url }),
      });
      const extract = (await extractRes.json()) as { data?: any; error?: string };
      if (!extractRes.ok || !extract.data) throw new Error(extract.error || "Failed to extract data");

      setGenerateStep("Storing data…");
      await supabase.from("resumes").update({ resume_data: extract.data }).eq("id", inserted.id);

      setGenerateStep("Opening builder…");
      router.push(`/candidate/resume-builder/templates?resumeId=${inserted.id}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save resume";
      toast.error(message);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Start your resume</h1>
        <p className="text-muted-foreground">Create from scratch, pick a previous resume, or upload a new one.</p>
      </div>

      <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="">
        <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <RadioGroupItem id="opt-scratch" value="scratch" />
              <Label htmlFor="opt-scratch">Start from scratch</Label>
            </div>
            <CardTitle className="text-base">Blank form</CardTitle>
            <CardDescription>Fill the form manually and choose a template.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={startScratch} variant="outline" size="sm">Start</Button>
          </CardContent>
        </Card>

     

        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <RadioGroupItem id="opt-upload" value="upload" />
              <Label htmlFor="opt-upload">Upload new resume</Label>
            </div>
            <CardTitle className="text-base">PDF only</CardTitle>
            <CardDescription>We will parse it to prefill the form.</CardDescription>
          </CardHeader>
          <CardContent>
            <FileUpload bucketId="resume" accept="application/pdf" pathPrefix="resumes" onUploaded={handleUploaded} />
            {loading && <div className="text-xs text-muted-foreground mt-2">Saving…</div>}
          </CardContent>
        </Card>
        </div>
        <Card className="w-full h-[50vh]">
          <CardHeader className="space-y-1 ">
            <div className="flex items-center gap-2">
              <RadioGroupItem id="opt-previous" value="previous" />
              <Label htmlFor="opt-previous">Use previous resume</Label>
            </div>

            <CardTitle className="text-base">Your uploads</CardTitle>
            <CardDescription>Select one to prefill the form.</CardDescription>
            <div className="flex items-center justify-between">
              {selected && <div className="text-xs text-muted-foreground truncate max-w-[60%]">{selected.file_name}</div>}
              <Button onClick={continueWithPrevious} disabled={!selectedId} size="sm">Continue</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {resumes.length === 0 ? (
              <div className="text-sm text-muted-foreground">No previous resumes.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ScrollArea className="h-[30vh] md:col-span-1 rounded-md border">
                  <div className="p-2 space-y-2">
                    {resumes.map((r) => {
                      const isSel = selectedId === r.id;
                      return (
                        <motion.button
                          type="button"
                          key={r.id}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => { setSelectedId(r.id); setSelected(r); }}
                          className={`w-full text-left rounded-md border p-2 transition-colors ${isSel ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                        >
                          <div className="text-sm font-medium truncate">{r.file_name}</div>
                          <div className="text-xs text-muted-foreground">{new Date(r.uploaded_at).toLocaleString()}</div>
                        </motion.button>
                      );
                    })}
                  </div>
                </ScrollArea>
                <div className="md:col-span-2 hidden md:block">
                  {selected ? (
                    // <AspectRatio ratio={3/4}>
                      <iframe
                        src={`${selected.file_url}#toolbar=0`}
                        className="h-[30vh] w-full rounded-md border"
                        loading="lazy"
                        title="Selected resume preview"
                      />
                    // </AspectRatio>
                  ) : (
                    <div className="h-[30vh] rounded-md border grid place-items-center text-sm text-muted-foreground">
                      Select a resume to preview
                    </div>
                  )}
                </div>
              </div>
            )}
           
          </CardContent>
        </Card>
      </RadioGroup>
      

      <Dialog open={generating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generating your editable resume…</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Progress value={progress} />
            <div className="text-sm text-muted-foreground">{generateStep || "Working…"}</div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}