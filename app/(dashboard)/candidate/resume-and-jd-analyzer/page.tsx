"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { toast } from "sonner";
import { FileUpload } from "@/components/upload/file-upload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

type AnalysisResult = {
  overall_match_score: number;
  role_inferred: string;
  summary: string;
  keyword_matching: {
    matched_keywords: string[];
    missing_keywords: string[];
    match_score: number;
  };
  experience_alignment: {
    strengths: string[];
    gaps: string[];
    years_of_experience_estimate?: number;
  };
  responsibilities_alignment: {
    satisfied_requirements: string[];
    partially_satisfied: string[];
    missing_requirements: string[];
  };
  education_cert_alignment: {
    meets_requirements: boolean;
    missing_certifications: string[];
    recommended_certifications: string[];
  };
  resume_improvements: string[];
  tailored_bullet_suggestions: string[];
  recommended_keywords_to_add: string[];
  ats_considerations: string[];
  interview_preparation: {
    technical_questions: string[];
    behavioral_questions: string[];
    domain_questions: string[];
    estimated_seniority: string;
  };
  risk_flags: string[];
  next_steps: string[];
};

type ResumeRow = {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  uploaded_at: string;
  resume_content: string | null;
};

export default function ResumeAndJDAnalyzer() {
  const supabase = useMemo(() => createClient(), []);
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [defaultUrl, setDefaultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [jdText, setJdText] = useState<string>("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState<string>("");
  const [dialogResult, setDialogResult] = useState<AnalysisResult | null>(null);

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
          .select("id,user_id,file_name,file_url,storage_path,uploaded_at,resume_content")
          .eq("user_id", userId)
          .eq("is_deleted", false)
          .order("uploaded_at", { ascending: false }),
        supabase
          .from("candidate_profiles")
          .select("resume_url")
          .eq("user_id", userId)
          .single(),
      ]);

      if (resumeErr) throw resumeErr;
      if (profErr && profErr.code !== "PGRST116") throw profErr;

      setResumes((resumeRows as ResumeRow[]) ?? []);
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
      toast.success("Resume uploaded");
      await fetchData();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save resume";
      toast.error(msg);
    }
  };

  const analyze = async (resumeId: string) => {
    try {
      if (!jdText || jdText.trim().length < 20) throw new Error("Paste a meaningful job description first");
      setBusyId(resumeId);
      const row = resumes.find((r) => r.id === resumeId);
      if (!row) throw new Error("Resume not found");

      const resp = await fetch(`/api/resume-and-jd-analyzer?t=${Date.now()}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resumeId, jd: jdText }),
      });
      const contentType = resp.headers.get("content-type") || "";
      let json: any = null;
      let textFallback: string | null = null;
      if (contentType.includes("application/json")) {
        try {
          json = await resp.json();
        } catch (e) {
          try {
            textFallback = await resp.text();
          } catch {
            textFallback = null;
          }
        }
      } else {
        try {
          textFallback = await resp.text();
        } catch {
          textFallback = null;
        }
      }
      if (!json && textFallback) {
        try {
          json = JSON.parse(textFallback);
        } catch {
          json = null;
        }
      }
      if (!resp.ok) throw new Error((json && json.error) || textFallback?.slice(0, 300) || "Failed to generate analysis");
      if (!json || !json.data) throw new Error(textFallback?.slice(0, 300) || "Unexpected response from server");

      setDialogTitle(row.file_name);
      setDialogResult(json.data as AnalysisResult);
      setDialogOpen(true);
      toast.success("Generated JD match analysis");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to generate analysis";
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  };

  const ResultView = ({ result }: { result: AnalysisResult }) => {
    return (
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="font-medium">Overall Match</div>
          <div className="text-base font-semibold">{Math.round(result.overall_match_score)} / 100</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground mb-1">Role Inferred</div>
            <div className="font-medium truncate">{result.role_inferred}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground mb-1">Keyword Match</div>
            <Progress value={result.keyword_matching.match_score} />
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-muted-foreground mb-1">Seniority</div>
            <div className="font-medium truncate">{result.interview_preparation.estimated_seniority}</div>
          </div>
        </div>
        <div>
          <div className="font-medium mb-1">Summary</div>
          <p className="text-muted-foreground">{result.summary}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium mb-1">Matched Keywords</div>
            <div className="flex flex-wrap gap-1.5">
              {result.keyword_matching.matched_keywords.map((k, i) => (
                <Badge key={i} variant="secondary">{k}</Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">Missing Keywords</div>
            <div className="flex flex-wrap gap-1.5">
              {result.keyword_matching.missing_keywords.map((k, i) => (
                <Badge key={i} variant="outline">{k}</Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium mb-1">Experience Strengths</div>
            <ul className="list-disc pl-5 space-y-1">
              {result.experience_alignment.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-medium mb-1">Experience Gaps</div>
            <ul className="list-disc pl-5 space-y-1">
              {result.experience_alignment.gaps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <div className="font-medium mb-1">Resume Improvements</div>
          <ul className="list-disc pl-5 space-y-1">
            {result.resume_improvements.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-medium mb-1">Suggested Tailored Bullets</div>
          <ul className="list-disc pl-5 space-y-1">
            {result.tailored_bullet_suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium mb-1">Responsibilities Alignment</div>
            <div className="text-xs font-medium mt-1">Satisfied</div>
            <div className="flex flex-wrap gap-1.5">
              {result.responsibilities_alignment.satisfied_requirements.map((k, i) => (
                <Badge key={i} variant="secondary">{k}</Badge>
              ))}
            </div>
            <div className="text-xs font-medium mt-2">Partially satisfied</div>
            <div className="flex flex-wrap gap-1.5">
              {result.responsibilities_alignment.partially_satisfied.map((k, i) => (
                <Badge key={i} variant="outline">{k}</Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">Missing Responsibilities</div>
            <div className="flex flex-wrap gap-1.5">
              {result.responsibilities_alignment.missing_requirements.map((k, i) => (
                <Badge key={i} variant="destructive">{k}</Badge>
              ))}
            </div>
            <div className="font-medium mt-4 mb-1">Recommended Keywords to Add</div>
            <div className="flex flex-wrap gap-1.5">
              {result.recommended_keywords_to_add.map((k, i) => (
                <Badge key={i} variant="outline">{k}</Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium mb-1">Education & Certifications</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Meets requirements: {result.education_cert_alignment.meets_requirements ? "Yes" : "No"}</li>
              {result.education_cert_alignment.missing_certifications.length > 0 && (
                <li>Missing: {result.education_cert_alignment.missing_certifications.join(", ")}</li>
              )}
              {result.education_cert_alignment.recommended_certifications.length > 0 && (
                <li>Recommended: {result.education_cert_alignment.recommended_certifications.join(", ")}</li>
              )}
            </ul>
          </div>
          <div>
            <div className="font-medium mb-1">ATS Considerations</div>
            <ul className="list-disc pl-5 space-y-1">
              {result.ats_considerations.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium mb-1">Interview Preparation</div>
            <div className="text-xs font-medium">Technical</div>
            <ul className="list-disc pl-5 space-y-1">
              {result.interview_preparation.technical_questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
            <div className="text-xs font-medium mt-2">Behavioral</div>
            <ul className="list-disc pl-5 space-y-1">
              {result.interview_preparation.behavioral_questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-medium mb-1">Domain Questions</div>
            <ul className="list-disc pl-5 space-y-1">
              {result.interview_preparation.domain_questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
            <div className="font-medium mt-4 mb-1">Risks & Red Flags</div>
            <ul className="list-disc pl-5 space-y-1">
              {result.risk_flags.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
        <div>
          <div className="font-medium mb-1">Next Steps</div>
          <ul className="list-disc pl-5 space-y-1">
            {result.next_steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Resume + JD Analyzer</h1>
        <p className="text-muted-foreground">Select/upload a resume and paste a job description to get a tailored match analysis, improvement tips, and interview prep.</p>

        <Button variant="outline" size="lg" asChild className="mt-2">
          <Link href="/candidate/resume-and-jd-analyzer/history">Show History</Link>
        </Button>
      </div>

      <div className="space-y-3">
        <FileUpload
          bucketId="resume"
          accept="application/pdf"
          label="Upload resume (PDF)"
          pathPrefix="resumes"
          onUploaded={handleUploaded}
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium">Job Description</h2>
        <Textarea
          placeholder="Paste the job description here"
          rows={8}
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
        />
        <div className="text-xs text-muted-foreground">Tip: Include responsibilities, required skills, and nice-to-haves.</div>
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
              const isBusy = busyId === r.id;
              const isDefault = !!defaultUrl && r.file_url === defaultUrl;
              const isSelected = selectedResumeId === r.id;
              return (
                <Card key={r.id} className={isSelected ? "ring-2 ring-primary" : ""}>
                  <CardHeader>
                    <CardTitle className="truncate flex items-center justify-between gap-2">
                      <span className="truncate">{r.file_name}</span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => window.open(r.file_url, "_blank")}>Open</Button>
                        <Button size="sm" variant={isSelected ? "secondary" : "outline"} onClick={() => setSelectedResumeId(r.id)}>
                          {isSelected ? "Selected" : "Select"}
                        </Button>
                        <Button size="sm" disabled={isBusy} onClick={() => void analyze(r.id)}>
                          {isBusy ? "Processing…" : "Analyze with this JD"}
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Uploaded {new Date(r.uploaded_at).toLocaleString()} {isDefault ? "• Default" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <AspectRatio ratio={3 / 4}>
                      <iframe
                        src={`${r.file_url}#toolbar=0`}
                        className="h-full w-full rounded-md border"
                        loading="lazy"
                        title={`${r.file_name} preview`}
                      />
                    </AspectRatio>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={!selectedResumeId || !!busyId}
          onClick={() => selectedResumeId && void analyze(selectedResumeId)}
        >
          {busyId ? "Processing…" : "Analyze Selected Resume"}
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <DialogTitle className="truncate max-w-[48ch]">{dialogTitle}</DialogTitle>
                <DialogDescription>JD Match Report</DialogDescription>
              </div>
              {dialogResult && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Match {Math.round(dialogResult.overall_match_score)} / 100</Badge>
                  <Badge variant="outline">Keywords {Math.round(dialogResult.keyword_matching.match_score)} / 100</Badge>
                </div>
              )}
            </div>
          </DialogHeader>
          {dialogResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 rounded-md border p-4 space-y-2">
                  <div className="text-sm font-medium">Overall Match</div>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold min-w-16">{Math.round(dialogResult.overall_match_score)}</div>
                    <Progress value={dialogResult.overall_match_score} />
                  </div>
                </div>
                <div className="col-span-1 rounded-md border p-4 space-y-2">
                  <div className="text-sm font-medium">Keyword Match</div>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold min-w-16">{Math.round(dialogResult.keyword_matching.match_score)}</div>
                    <Progress value={dialogResult.keyword_matching.match_score} />
                  </div>
                </div>
                <div className="col-span-1 rounded-md border p-4 space-y-2">
                  <div className="text-sm font-medium">Seniority</div>
                  <div className="text-xs">{dialogResult.interview_preparation.estimated_seniority}</div>
                </div>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="keywords">Keywords</TabsTrigger>
                  <TabsTrigger value="alignment">Alignment</TabsTrigger>
                  <TabsTrigger value="resume">Resume</TabsTrigger>
                  <TabsTrigger value="interview">Interview</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="pt-3">
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium mb-1">Summary</div>
                      <p className="text-sm text-muted-foreground">{dialogResult.summary}</p>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Next Steps</div>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {dialogResult.next_steps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="keywords" className="pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium mb-1">Matched Keywords</div>
                      <div className="flex flex-wrap gap-1.5">
                        {dialogResult.keyword_matching.matched_keywords.map((k, i) => (
                          <Badge key={i} variant="secondary">{k}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Missing Keywords</div>
                      <div className="flex flex-wrap gap-1.5">
                        {dialogResult.keyword_matching.missing_keywords.map((k, i) => (
                          <Badge key={i} variant="outline">{k}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="font-medium mb-1">Recommended Keywords to Add</div>
                    <div className="flex flex-wrap gap-1.5">
                      {dialogResult.recommended_keywords_to_add.map((k, i) => (
                        <Badge key={i} variant="outline">{k}</Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="alignment" className="pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium mb-1">Experience Alignment</div>
                      <div className="text-xs font-medium mt-1">Strengths</div>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {dialogResult.experience_alignment.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                      <div className="text-xs font-medium mt-2">Gaps</div>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {dialogResult.experience_alignment.gaps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Responsibilities Alignment</div>
                      <div className="text-xs font-medium mt-1">Satisfied</div>
                      <div className="flex flex-wrap gap-1.5">
                        {dialogResult.responsibilities_alignment.satisfied_requirements.map((k, i) => (
                          <Badge key={i} variant="secondary">{k}</Badge>
                        ))}
                      </div>
                      <div className="text-xs font-medium mt-2">Partially satisfied</div>
                      <div className="flex flex-wrap gap-1.5">
                        {dialogResult.responsibilities_alignment.partially_satisfied.map((k, i) => (
                          <Badge key={i} variant="outline">{k}</Badge>
                        ))}
                      </div>
                      <div className="text-xs font-medium mt-2">Missing</div>
                      <div className="flex flex-wrap gap-1.5">
                        {dialogResult.responsibilities_alignment.missing_requirements.map((k, i) => (
                          <Badge key={i} variant="destructive">{k}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground mb-1">Education & Certifications</div>
                      <div>Meets requirements: {dialogResult.education_cert_alignment.meets_requirements ? "Yes" : "No"}</div>
                      {dialogResult.education_cert_alignment.missing_certifications.length > 0 && (
                        <div>Missing: {dialogResult.education_cert_alignment.missing_certifications.join(", ")}</div>
                      )}
                      {dialogResult.education_cert_alignment.recommended_certifications.length > 0 && (
                        <div>Recommended: {dialogResult.education_cert_alignment.recommended_certifications.join(", ")}</div>
                      )}
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground mb-1">ATS Considerations</div>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {dialogResult.ats_considerations.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="resume" className="pt-3">
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium mb-1">Resume Improvements</div>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {dialogResult.resume_improvements.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Tailored Bullet Suggestions</div>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {dialogResult.tailored_bullet_suggestions.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="interview" className="pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-md border p-3">
                      <div className="text-sm font-medium mb-1">Technical</div>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {dialogResult.interview_preparation.technical_questions.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-sm font-medium mb-1">Behavioral</div>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {dialogResult.interview_preparation.behavioral_questions.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-sm font-medium mb-1">Domain</div>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {dialogResult.interview_preparation.domain_questions.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="pt-3">
                  <div className="rounded-md border p-3 bg-muted/30">
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(dialogResult, null, 2)}</pre>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No result to display.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


