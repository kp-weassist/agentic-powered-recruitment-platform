"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

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

type HistoryRow = {
  id: string;
  created_at: string;
  jd: string;
  analysis: AnalysisResult;
  resumes: {
    file_name: string;
    file_url: string;
  } | null;
};

export default function JDAnalysisHistoryPage() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        setRows([]);
        return;
      }

      const { data, error } = await supabase
        .from("resume_jd_analysis_history")
        .select("id,created_at,jd,analysis,resumes:resume_id(file_name,file_url,is_deleted)")
        .eq("user_id", userId)
        .eq("resumes.is_deleted", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRows((data as unknown as HistoryRow[]) ?? []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load history";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <h1 className="text-2xl font-semibold tracking-tight">JD Match History</h1>
        <p className="text-muted-foreground">Review past analyses with the associated resume preview and the job description you used.</p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">No history yet. Run an analysis to see it here.</div>
      ) : (
        <div className="space-y-4">
          {rows.map((row, idx) => (
            <Collapsible key={row.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span className="truncate">{row.resumes?.file_name ?? "Unknown resume"}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Match {Math.round(row.analysis.overall_match_score)} / 100</Badge>
                      <Badge variant="outline">Keywords {Math.round(row.analysis.keyword_matching.match_score)} / 100</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</span>
                      <CollapsibleTrigger asChild>
                        <Button size="sm" variant="outline">{/* toggle */}Details View <ChevronDown className="size-4" /></Button>
                      </CollapsibleTrigger>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {row.resumes?.file_url ? (
                      <Button size="sm" variant="outline" onClick={() => window.open(row.resumes!.file_url, "_blank")}>
                        Open Resume
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Resume unavailable</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="font-medium mb-1">Resume Preview</div>
                        {row.resumes?.file_url ? (
                          <AspectRatio ratio={3 / 4}>
                            <iframe
                              src={`${row.resumes.file_url}#toolbar=0`}
                              className="h-full w-full rounded-md border"
                              loading="lazy"
                              title={`${row.resumes.file_name} preview`}
                            />
                          </AspectRatio>
                        ) : (
                          <div className="rounded-md border p-4 text-sm text-muted-foreground">Resume file not available.</div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium mb-1">Job Description</div>
                        <div className="rounded-md border p-3 max-h-[50vh] overflow-auto text-sm whitespace-pre-wrap">
                          {row.jd}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border p-4">
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
                          <ResultView result={row.analysis} />
                        </TabsContent>
                        <TabsContent value="keywords" className="pt-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <div className="font-medium mb-1">Matched Keywords</div>
                              <div className="flex flex-wrap gap-1.5">
                                {row.analysis.keyword_matching.matched_keywords.map((k, i) => (
                                  <Badge key={i} variant="secondary">{k}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium mb-1">Missing Keywords</div>
                              <div className="flex flex-wrap gap-1.5">
                                {row.analysis.keyword_matching.missing_keywords.map((k, i) => (
                                  <Badge key={i} variant="outline">{k}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="alignment" className="pt-3">
                          <div className="rounded-md border p-3 bg-muted/30">
                            <ResultView result={row.analysis} />
                          </div>
                        </TabsContent>
                        <TabsContent value="resume" className="pt-3">
                          <div className="space-y-4">
                            <div>
                              <div className="font-medium mb-1">Resume Improvements</div>
                              <ul className="list-disc pl-5 space-y-1 text-sm">
                                {row.analysis.resume_improvements.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <div className="font-medium mb-1">Tailored Bullet Suggestions</div>
                              <ul className="list-disc pl-5 space-y-1 text-sm">
                                {row.analysis.tailored_bullet_suggestions.map((s, i) => (
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
                                {row.analysis.interview_preparation.technical_questions.map((q, i) => (
                                  <li key={i}>{q}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="rounded-md border p-3">
                              <div className="text-sm font-medium mb-1">Behavioral</div>
                              <ul className="list-disc pl-5 space-y-1 text-sm">
                                {row.analysis.interview_preparation.behavioral_questions.map((q, i) => (
                                  <li key={i}>{q}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="rounded-md border p-3">
                              <div className="text-sm font-medium mb-1">Domain</div>
                              <ul className="list-disc pl-5 space-y-1 text-sm">
                                {row.analysis.interview_preparation.domain_questions.map((q, i) => (
                                  <li key={i}>{q}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="details" className="pt-3">
                          <div className="rounded-md border p-3 bg-muted/30">
                            <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(row.analysis, null, 2)}</pre>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}


