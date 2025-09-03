"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { toast } from "sonner";
import { FileUpload } from "@/components/upload/file-upload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type AtsResult = {
  ats_compatibility_score: number;
  summary: string;
  prioritized_actions: { impact: "high" | "medium" | "low"; description: string }[];
  keyword_matching: {
    inferred_role: string;
    matched_keywords: string[];
    missing_keywords: string[];
    match_score: number;
  };
  format_suggestions: string[];
  section_structure: {
    sections_present: string[];
    missing_sections: string[];
    recommendations: string[];
  };
  formatting_guides: string[];
  readability_score: number;
  action_verbs_score: number;
  quantifiable_achievements: { count: number; examples: string[] };
  length_appropriateness: string;
  ats_red_flags: string[];
  file_parse_risks: string[];
  contact_info_check: { has_email: boolean; has_phone: boolean; has_linkedin: boolean; issues: string[] };
  links_accessibility: { urls: string[]; are_urls_plain_text: boolean; issues: string[] };
  tables_graphics_usage: { has_tables: boolean; has_images: boolean; risks: string[] };
};

type ResumeRow = {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  uploaded_at: string;
  resume_content: string | null;
  ats_optimization_checker_results: AtsResult | null;
};

export default function ATSOptimizationChecker() {
  const supabase = useMemo(() => createClient(), []);
  const [resumes, setResumes] = useState<ResumeRow[]>([]);
  const [defaultUrl, setDefaultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState<string>("");
  const [dialogResumeId, setDialogResumeId] = useState<string | null>(null);
  const [dialogResult, setDialogResult] = useState<AtsResult | null>(null);

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
          .select("id,user_id,file_name,file_url,storage_path,uploaded_at,resume_content,ats_optimization_checker_results")
          .eq("user_id", userId)
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
      const msg = e instanceof Error ? e.message : "Failed to load ATS data";
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

  const analyzeResume = async (resumeId: string, force = false, opts?: { openDialog?: boolean; title?: string }) => {
    try {
      setBusyId(resumeId);
      // Find the resume row
      const row = resumes.find((r) => r.id === resumeId);
      if (!row) throw new Error("Resume not found");
      // Ensure we have text like in candidate-form flow
      let resumeText = row.resume_content || "";
      if (!resumeText || resumeText.trim().length < 50) {
        const parseRes = await fetch("/api/pdf-parser", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: row.file_url }),
        });
        let parseJson: any = null;
        try {
          parseJson = await parseRes.json();
        } catch {
          const t = await parseRes.text().catch(() => "");
          try {
            parseJson = JSON.parse(t);
          } catch {
            parseJson = { error: t?.slice(0, 300) || "Parse failed" };
          }
        }
        if (!parseRes.ok || !parseJson?.text) throw new Error(parseJson?.error || "Failed to parse PDF");
        resumeText = String(parseJson.text);
        // Persist like resumes page
        try {
          const { data: auth } = await supabase.auth.getUser();
          const userId = auth.user?.id;
          if (userId) {
            await supabase
              .from("resumes")
              .update({ resume_content: resumeText })
              .eq("id", resumeId)
              .eq("user_id", userId);
          }
        } catch {
          // non-blocking
        }
      }

      const resp = await fetch(`/api/ats-optimization-checker?t=${Date.now()}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resumeId, text: resumeText, resumeUrl: row.file_url, force }),
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
      toast.success(json.cached ? "Loaded cached ATS result" : "Generated ATS analysis");
      // Update local state
      setResumes((prev) =>
        prev.map((r) => (r.id === resumeId ? { ...r, ats_optimization_checker_results: json.data as AtsResult } : r)),
      );
      if (opts?.openDialog) {
        setDialogTitle(opts.title || row.file_name);
        setDialogResumeId(resumeId);
        setDialogResult(json.data as AtsResult);
        setDialogOpen(true);
      } else {
        setExpanded((prev) => ({ ...prev, [resumeId]: true }));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to generate analysis";
      toast.error(msg);
    } finally {
      setBusyId(null);
    }
  };

  const ResultView = ({ result }: { result: AtsResult }) => {
    return (
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="font-medium">ATS Compatibility</div>
          <div className="text-base font-semibold">{Math.round(result.ats_compatibility_score)} / 100</div>
        </div>
        <div>
          <div className="font-medium mb-1">Summary</div>
          <p className="text-muted-foreground">{result.summary}</p>
        </div>
        <div>
          <div className="font-medium mb-1">Prioritized Actions</div>
          <ul className="list-disc pl-5 space-y-1">
            {result.prioritized_actions.map((a, idx) => (
              <li key={idx}>
                <span className="uppercase text-xs mr-2 px-1 py-0.5 rounded bg-muted">{a.impact}</span>
                {a.description}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium mb-1">Keyword Matching ({Math.round(result.keyword_matching.match_score)} / 100)</div>
            <div className="text-xs text-muted-foreground mb-1">Inferred role: {result.keyword_matching.inferred_role}</div>
            <div className="mb-1">
              <div className="text-xs font-medium">Matched</div>
              <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                {result.keyword_matching.matched_keywords.map((k, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded border">
                    {k}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium">Missing</div>
              <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                {result.keyword_matching.missing_keywords.map((k, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded border bg-amber-50">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">Readability & Style</div>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Readability score: {Math.round(result.readability_score)} / 100</li>
              <li>Action verbs score: {Math.round(result.action_verbs_score)} / 100</li>
              <li>Length: {result.length_appropriateness}</li>
            </ul>
          </div>
        </div>
        <div>
          <div className="font-medium mb-1">Section Structure</div>
          <ul className="list-disc pl-5 space-y-1">
            {result.section_structure.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-medium mb-1">Formatting Guides</div>
          <ul className="list-disc pl-5 space-y-1">
            {result.formatting_guides.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium mb-1">Quantifiable Achievements</div>
            <div className="text-sm mb-1">Count: {result.quantifiable_achievements.count}</div>
            <ul className="list-disc pl-5 space-y-1">
              {result.quantifiable_achievements.examples.map((ex, i) => (
                <li key={i}>{ex}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-medium mb-1">Risks & Red Flags</div>
            <ul className="list-disc pl-5 space-y-1">
              {result.ats_red_flags.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
              {result.file_parse_risks.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="font-medium mb-1">Contact Info</div>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Email present: {result.contact_info_check.has_email ? "Yes" : "No"}</li>
              <li>Phone present: {result.contact_info_check.has_phone ? "Yes" : "No"}</li>
              <li>LinkedIn present: {result.contact_info_check.has_linkedin ? "Yes" : "No"}</li>
            </ul>
          </div>
          <div>
            <div className="font-medium mb-1">Links & Media</div>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>URLs are plain text: {result.links_accessibility.are_urls_plain_text ? "Yes" : "No"}</li>
              <li>Has tables: {result.tables_graphics_usage.has_tables ? "Yes" : "No"}</li>
              <li>Has images: {result.tables_graphics_usage.has_images ? "Yes" : "No"}</li>
            </ul>
          </div>
        </div>
        <div>
          <div className="font-medium mb-1">Format Suggestions</div>
          <ul className="list-disc pl-5 space-y-1">
            {result.format_suggestions.map((s, i) => (
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
        <h1 className="text-2xl font-semibold tracking-tight">ATS Optimization Checker</h1>
        <p className="text-muted-foreground">
          Generate ATS analysis for your default or previous resumes. View results, and regenerate anytime.
        </p>
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

      {/* <div className="space-y-3">
        <h2 className="text-sm font-medium">Default resume</h2>
        {defaultUrl ? (
          (() => {
            const def = resumes.find((r) => r.file_url === defaultUrl);
            if (!def) return <div className="rounded-md border p-4 text-sm text-muted-foreground">No default resume row found.</div>;
            const hasResult = !!def.ats_optimization_checker_results;
            const isBusy = busyId === def.id;
            const isExpanded = !!expanded[def.id];
            return (
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="truncate flex items-center justify-between">
                    {def.file_name}
                    <div className="space-x-2">
                      <Button size="sm" variant="outline" onClick={() => window.open(def.file_url, "_blank")}>Open</Button>
                      <Button size="sm" disabled={isBusy} onClick={() => void analyzeResume(def.id, false)}>
                        {isBusy ? "Processing…" : hasResult ? "Show ATS result" : "Generate analysis"}
                      </Button>
                      {hasResult && (
                        <Button size="sm" variant="secondary" disabled={isBusy} onClick={() => void analyzeResume(def.id, true)}>
                          {isBusy ? "Processing…" : "Regenerate"}
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription>Inline preview and ATS analysis for your default resume</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AspectRatio ratio={3 / 4}>
                    <iframe src={`${def.file_url}#toolbar=0`} className="h-[50vh] w-full rounded-md border" loading="lazy" title="Default resume preview" />
                  </AspectRatio>
                  {isExpanded && def.ats_optimization_checker_results && (
                    <div className="rounded-md border p-4">
                      <ResultView result={def.ats_optimization_checker_results} />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()
        ) : (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">No default resume set yet.</div>
        )}
      </div> */}

      <div className="space-y-3">
        <h2 className="text-sm font-medium">Previous uploads</h2>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : resumes.length === 0 ? (
          <div className="text-sm text-muted-foreground">No resumes uploaded yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((r) => {
              const hasResult = !!r.ats_optimization_checker_results;
              const isBusy = busyId === r.id;
              const isExpanded = !!expanded[r.id];
              const isDefault = !!defaultUrl && r.file_url === defaultUrl;
              return (
                <Card key={r.id}>
                  <CardHeader>
                    <CardTitle className="truncate flex items-center justify-between flex-wrap">
                      <span className="truncate">{r.file_name}</span>
                      <div className="space-x-2 flex-wrap" >
                        <Button size="sm" variant="outline" onClick={() => window.open(r.file_url, "_blank")}>Open</Button>
                        {hasResult ? (
                          <Button
                            size="sm"
                            disabled={isBusy}
                            onClick={() => {
                              setDialogTitle(r.file_name);
                              setDialogResumeId(r.id);
                              setDialogResult(r.ats_optimization_checker_results as AtsResult);
                              setDialogOpen(true);
                            }}
                          >
                            {isBusy ? "Processing…" : "Show ATS result"}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isBusy}
                            onClick={() => void analyzeResume(r.id, false, { openDialog: true, title: r.file_name })}
                          >
                            {isBusy ? "Processing…" : "Generate analysis"}
                          </Button>
                        )}
                        {hasResult && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isBusy}
                            onClick={() => void analyzeResume(r.id, true, { openDialog: true, title: r.file_name })}
                          >
                            {isBusy ? "Processing…" : "Regenerate"}
                          </Button>
                        )}
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Uploaded {new Date(r.uploaded_at).toLocaleString()} {isDefault ? "• Default" : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <AspectRatio ratio={3 / 4}>
                      <iframe
                        src={`${r.file_url}#toolbar=0`}
                        className="h-full w-full rounded-md border"
                        loading="lazy"
                        title={`${r.file_name} preview`}
                      />
                    </AspectRatio>
                    {isExpanded && r.ats_optimization_checker_results && (
                      <div className="rounded-md border p-4">
                        <ResultView result={r.ats_optimization_checker_results} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <DialogTitle className="truncate max-w-[48ch]">{dialogTitle}</DialogTitle>
                <DialogDescription>ATS Optimization Report</DialogDescription>
              </div>
              {dialogResult && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">ATS {Math.round(dialogResult.ats_compatibility_score)} / 100</Badge>
                  <Badge variant="outline">Keywords {Math.round(dialogResult.keyword_matching.match_score)} / 100</Badge>
                </div>
              )}
            </div>
          </DialogHeader>
          {dialogResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-1 rounded-md border p-4 space-y-2">
                  <div className="text-sm font-medium">ATS Compatibility</div>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold min-w-16">{Math.round(dialogResult.ats_compatibility_score)}</div>
                    <Progress value={dialogResult.ats_compatibility_score} />
                  </div>
                  <div className="text-xs text-muted-foreground">Higher is better</div>
                </div>
                <div className="col-span-1 md:col-span-1 rounded-md border p-4 space-y-2">
                  <div className="text-sm font-medium">Keyword Match</div>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold min-w-16">{Math.round(dialogResult.keyword_matching.match_score)}</div>
                    <Progress value={dialogResult.keyword_matching.match_score} />
                  </div>
                  <div className="text-xs text-muted-foreground">Inferred role: {dialogResult.keyword_matching.inferred_role}</div>
                </div>
                <div className="col-span-1 md:col-span-1 rounded-md border p-4 space-y-2">
                  <div className="text-sm font-medium">Readability & Verbs</div>
                  <div className="text-xs">Readability</div>
                  <Progress value={dialogResult.readability_score} />
                  <div className="text-xs mt-2">Action Verbs</div>
                  <Progress value={dialogResult.action_verbs_score} />
                </div>
              </div>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="keywords">Keywords</TabsTrigger>
                  <TabsTrigger value="structure">Structure</TabsTrigger>
                  <TabsTrigger value="formatting">Formatting</TabsTrigger>
                  <TabsTrigger value="risks">Risks</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="pt-3">
                  <div className="space-y-4">
                    <div>
                      <div className="font-medium mb-1">Summary</div>
                      <p className="text-sm text-muted-foreground">{dialogResult.summary}</p>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Prioritized Actions</div>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {dialogResult.prioritized_actions.map((a, idx) => (
                          <li key={idx}>
                            <Badge variant={a.impact === "high" ? "destructive" : a.impact === "medium" ? "secondary" : "outline"} className="mr-2 uppercase">
                              {a.impact}
                            </Badge>
                            {a.description}
                          </li>
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
                </TabsContent>

                <TabsContent value="structure" className="pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium mb-1">Sections Present</div>
                      <div className="flex flex-wrap gap-1.5">
                        {dialogResult.section_structure.sections_present.map((s, i) => (
                          <Badge key={i} variant="secondary">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Missing Sections</div>
                      <div className="flex flex-wrap gap-1.5">
                        {dialogResult.section_structure.missing_sections.map((s, i) => (
                          <Badge key={i} variant="outline">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="font-medium mb-1">Recommendations</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {dialogResult.section_structure.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground mb-1">Length</div>
                      <div className="font-medium">{dialogResult.length_appropriateness}</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground mb-1">Readability</div>
                      <Progress value={dialogResult.readability_score} />
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground mb-1">Action Verbs</div>
                      <Progress value={dialogResult.action_verbs_score} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="formatting" className="pt-3">
                  <div>
                    <div className="font-medium mb-1">Formatting Guides</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {dialogResult.formatting_guides.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4">
                    <div className="font-medium mb-1">Format Suggestions</div>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {dialogResult.format_suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="risks" className="pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium mb-1">ATS Red Flags</div>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {dialogResult.ats_red_flags.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium mb-1">File Parse Risks</div>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {dialogResult.file_parse_risks.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground mb-1">Contact Info</div>
                      <div>Email: {dialogResult.contact_info_check.has_email ? "Yes" : "No"}</div>
                      <div>Phone: {dialogResult.contact_info_check.has_phone ? "Yes" : "No"}</div>
                      <div>LinkedIn: {dialogResult.contact_info_check.has_linkedin ? "Yes" : "No"}</div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground mb-1">Links</div>
                      <div>Plain text: {dialogResult.links_accessibility.are_urls_plain_text ? "Yes" : "No"}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                        {dialogResult.links_accessibility.urls.map((u, i) => (
                          <Badge key={i} variant="outline">{u}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-md border p-3">
                      <div className="text-xs text-muted-foreground mb-1">Tables & Graphics</div>
                      <div>Tables: {dialogResult.tables_graphics_usage.has_tables ? "Yes" : "No"}</div>
                      <div>Images: {dialogResult.tables_graphics_usage.has_images ? "Yes" : "No"}</div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="pt-3">
                  <div className="rounded-md border p-3 bg-muted/30">
                    <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words">{JSON.stringify(dialogResult, null, 2)}</pre>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  disabled={!dialogResumeId || busyId === dialogResumeId}
                  onClick={() => dialogResumeId && void analyzeResume(dialogResumeId, true, { openDialog: true, title: dialogTitle })}
                >
                  {busyId === dialogResumeId ? "Processing…" : "Regenerate"}
                </Button>
                <Button onClick={() => setDialogOpen(false)}>Close</Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No result to display.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
