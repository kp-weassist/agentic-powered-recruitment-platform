"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/upload/file-upload";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { toast } from "sonner";

type ResumeRow = {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  uploaded_at: string;
};

export default function ResumesPage() {
  const supabase = useMemo(() => createClient(), []);
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [defaultUrl, setDefaultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingDefaultId, setSavingDefaultId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        setResumes([]);
        setDefaultUrl(null);
        return;
      }

      const [{ data: resumeRows, error: resumeErr }, { data: profileRow, error: profErr }] = await Promise.all([
        supabase
          .from("resumes")
          .select("id,user_id,file_name,file_url,storage_path,uploaded_at")
          .eq("user_id", userId)
          .order("uploaded_at", { ascending: false }),
        supabase
          .from("candidate_profiles")
          .select("resume_url")
          .eq("user_id", userId)
          .single(),
      ]);

      if (resumeErr) throw resumeErr;
      if (profErr && profErr.code !== "PGRST116") throw profErr; // ignore not found

      setResumes(resumeRows ?? []);
      setDefaultUrl((profileRow?.resume_url as string | null) ?? null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load resumes";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUploaded = async (publicUrl: string, path: string) => {
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("You must be signed in");

      const fileName = path.split("/").pop() ?? path;
      const { error } = await supabase.from("resumes").insert({
        user_id: userId,
        file_name: fileName,
        file_url: publicUrl,
        storage_path: path,
      });
      if (error) throw error;
      toast.success("Resume saved");
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save resume";
      toast.error(msg);
    }
  };

  const setAsDefault = async (resume: ResumeRow) => {
    try {
      setSavingDefaultId(resume.id);
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("You must be signed in");

      const { error } = await supabase
        .from("candidate_profiles")
        .update({ resume_url: resume.file_url })
        .eq("user_id", userId);
      if (error) throw error;
      setDefaultUrl(resume.file_url);
      toast.success("Default resume updated");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to set default";
      toast.error(msg);
    } finally {
      setSavingDefaultId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Resumes</h1>
        <p className="text-muted-foreground">Upload a new resume, preview past uploads, and set your default.</p>
      </div>

      <div className="space-y-3">
        {/* <h2 className="text-sm font-medium">Upload</h2> */}
        <FileUpload
          bucketId="resume"
          accept="application/pdf"
          label="Upload resume (PDF)"
          pathPrefix="resumes"
          onUploaded={handleUploaded}
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium">Current default</h2>
        {defaultUrl ? (
          <Card className="w-full h-[65vh]">
            <CardHeader>
              <CardTitle className="truncate flex items-center justify-between">
                {resumes.find((r) => r.file_url === defaultUrl)?.file_name ?? "Default resume"}

                <a href={defaultUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">Open in new tab</Button>
              </a>
              </CardTitle>
              <CardDescription>Inline preview of your default resume</CardDescription>
            </CardHeader>
            <CardContent>
              <AspectRatio ratio={3 / 4}>
                <iframe
                  src={`${defaultUrl}#toolbar=0`}
                  className="h-[50vh] w-full rounded-md border"
                  loading="lazy"
                  title="Default resume preview"
                />
              </AspectRatio>
            </CardContent>
            {/* <CardFooter className="justify-between">
              <a href={defaultUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">Open</Button>
              </a>
              <div className="text-xs text-muted-foreground">This is your default</div>
            </CardFooter> */}
          </Card>
        ) : (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">No default resume set yet.</div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-medium">Previous uploads</h2>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : resumes.length === 0 ? (
          <div className="text-sm text-muted-foreground">No resumes uploaded yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((r) => {
              const isDefault = !!defaultUrl && r.file_url === defaultUrl;
              return (
                <Card key={r.id}>
                  <CardHeader>
                    <CardTitle className="truncate">{r.file_name}</CardTitle>
                    <CardDescription>Uploaded {new Date(r.uploaded_at).toLocaleString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AspectRatio ratio={3 / 4}>
                      <iframe
                        src={`${r.file_url}#toolbar=0`}
                        className="h-full w-full rounded-md border"
                        loading="lazy"
                        title={`${r.file_name} preview`}
                      />
                    </AspectRatio>
                  </CardContent>
                  <CardFooter className="justify-between">
                    <a href={r.file_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">Open</Button>
                    </a>
                    <Button
                      size="sm"
                      disabled={isDefault || savingDefaultId === r.id}
                      onClick={() => void setAsDefault(r)}
                    >
                      {isDefault ? "Default" : savingDefaultId === r.id ? "Saving…" : "Make default"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
