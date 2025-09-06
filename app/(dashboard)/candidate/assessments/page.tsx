"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Assessment = {
  id: string;
  title: string;
  status: string;
  total_questions: number;
  time_limit_seconds: number;
  created_at: string;
};

type ResumeRow = {
  id: string;
  file_name: string;
};

export default function AssessmentsPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        setAssessments([]);
        setResumes([]);
        return;
      }
      const [{ data: a }, { data: r }] = await Promise.all([
        supabase
          .from("assessments")
          .select("id,title,status,total_questions,time_limit_seconds,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("resumes")
          .select("id,file_name")
          .eq("user_id", userId)
          .eq("is_deleted", false)
          .order("uploaded_at", { ascending: false }),
      ]);
      setAssessments((a as Assessment[]) ?? []);
      setResumes((r as any[]) ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load assessments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createAssessment = async () => {
    try {
      if (!jd || jd.trim().length < 20) throw new Error("Paste a meaningful job description first");
      setCreating(true);
      const resp = await fetch("/api/assessments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resumeId: resumeId || undefined, jd }),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || "Failed to create assessment");
      const id = json.assessment_id as string;
      toast.success("Assessment created");
      router.push(`/candidate/assessments/${id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create assessment");
    } finally {
      setCreating(false);
    }
  };

  const openResults = async (assessmentId: string) => {
    try {
      const { data, error } = await supabase
        .from("assessment_attempts")
        .select("id")
        .eq("assessment_id", assessmentId)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .single();
      if (!error && data?.id) {
        router.push(`/candidate/assessments/${assessmentId}/result?attempt=${data.id}`);
        return;
      }
    } catch {}
    router.push(`/candidate/assessments/${assessmentId}/result`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Assessments</h1>
        <p className="text-muted-foreground">Create an assessment from your resume + JD, or continue an assigned one.</p>
      </div>

          <Link href="/candidate/assessments/history">
          <Button variant="outline" size="lg" className="mt-2"> Show History</Button></Link>
      <Card>
        <CardHeader>
          <CardTitle>Create new assessment</CardTitle>
          <CardDescription>We will generate a tailored assessment from your resume and the job description.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Select resume (optional)</label>
              <select className="mt-1 w-full border rounded-md px-3 py-2 text-sm" value={resumeId ?? ""} onChange={(e) => setResumeId(e.target.value || null)}>
                <option value="">None</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>{r.file_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Optional title override</label>
              <Input disabled placeholder="Auto-generated" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Job Description</label>
            <Textarea className="mt-1" rows={8} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the job description here" />
          </div>
          <div className="flex justify-end">
            <Button disabled={creating} onClick={() => void createAssessment()}>{creating ? "Creating…" : "Create & Start"}</Button>
          </div>
        </CardContent>
      </Card>

      {/* <div className="space-y-2">
        <h2 className="text-lg font-semibold">Your assessments</h2>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : assessments.length === 0 ? (
          <div className="text-sm text-muted-foreground">No assessments yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assessments.map((a) => (
              <Card key={a.id}>
                <CardHeader>
                  <CardTitle className="truncate">{a.title}</CardTitle>
                  <CardDescription>
                    {a.total_questions} questions • {Math.round(a.time_limit_seconds / 60)} min • {a.status}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => router.push(`/candidate/assessments/${a.id}`)}>
                      {a.status === "completed" ? "Review" : a.status === "in_progress" ? "Resume" : "Start"}
                    </Button>
                    {a.status === "completed" && (
                      <Button size="sm" variant="outline" onClick={() => void openResults(a.id)}>
                        Results
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div> */}
    </div>
  );
}


