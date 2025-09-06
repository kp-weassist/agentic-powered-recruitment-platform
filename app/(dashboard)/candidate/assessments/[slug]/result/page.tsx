"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

type Attempt = {
  id: string;
  score_total: number | null;
  submitted_at: string | null;
  report?: any;
};

type AnswerRow = {
  id: string;
  question_id: string;
  is_correct: boolean | null;
  score: number | null;
  ai_feedback: any;
  questions: { question_index: number; question_type: string; question: string; max_score: number };
};

export default function AssessmentResultPage() {
  const params = useParams();
  const assessmentId = String(params?.slug);
  const search = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [assessmentTitle, setAssessmentTitle] = useState<string>("Assessment Results");

  const load = async () => {
    try {
      const attemptId = search.get("attempt");
      const { data: aTitle } = await supabase.from("assessments").select("title").eq("id", assessmentId).single();
      setAssessmentTitle((aTitle as any)?.title ?? "Assessment Results");

      let att: any = null;
      if (attemptId) {
        const { data, error } = await supabase.from("assessment_attempts").select("id,score_total,submitted_at,report").eq("id", attemptId).single();
        if (error) throw error;
        att = data;
      } else {
        const { data, error } = await supabase
          .from("assessment_attempts")
          .select("id,score_total,submitted_at,report")
          .eq("assessment_id", assessmentId)
          .order("submitted_at", { ascending: false })
          .limit(1)
          .single();
        if (error) throw error;
        att = data;
      }
      setAttempt(att);

      const { data: ans, error: ansErr } = await supabase
        .from("assessment_answers")
        .select("id,question_id,is_correct,score,ai_feedback,questions:question_id(question_index,question_type,question,max_score)")
        .eq("attempt_id", att.id);
      if (ansErr) throw ansErr;
      const sorted = ([...(ans as any[] ?? [])]).sort((a, b) => {
        const ai = a?.questions?.question_index ?? 0;
        const bi = b?.questions?.question_index ?? 0;
        return ai - bi;
      });
      setAnswers(sorted);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load results");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  const total = answers.reduce((s, a) => s + Number(a.questions.max_score || 0), 0);
  const earned = answers.reduce((s, a) => s + Number(a.score || 0), 0);
  const pct = total > 0 ? Math.round((earned / total) * 100) : 0;

  const getTypeLabel = (t: string) => t === "multiple_choice" ? "multiple_choice" : t;
  const extractFeedback = (fb: any): string => {
    if (!fb) return "No feedback available.";
    if (typeof fb === "string") {
      try { const parsed = JSON.parse(fb); return extractFeedback(parsed); } catch { return fb; }
    }
    if (fb.feedback && typeof fb.feedback === "string") return fb.feedback;
    if (fb.explanation && typeof fb.explanation === "string") return fb.explanation;
    return JSON.stringify(fb, null, 2);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{assessmentTitle}</h1>
        <p className="text-muted-foreground text-sm">Submitted {attempt?.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : "--"}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall Score</CardTitle>
          <CardDescription>
            {earned} / {total} ({pct}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={pct} />
        </CardContent>
      </Card>

      {attempt?.report && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Result Summary</CardTitle>
            <CardDescription>{attempt.report.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.isArray(attempt.report.sections) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {attempt.report.sections.map((s: any, i: number) => (
                  <div key={i} className="rounded-md border p-3 text-sm">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-muted-foreground mb-2">{s.score} / {s.max_score}</div>
                    <div className="text-xs font-medium">Strengths</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {(s.strengths || []).map((x: string, j: number) => (<li key={j}>{x}</li>))}
                    </ul>
                    <div className="text-xs font-medium mt-2">Improvements</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {(s.improvements || []).map((x: string, j: number) => (<li key={j}>{x}</li>))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {Array.isArray(attempt.report.recommendations) && attempt.report.recommendations.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-1">Recommendations</div>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {attempt.report.recommendations.map((r: string, i: number) => (<li key={i}>{r}</li>))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="questions">
        <TabsList>
          <TabsTrigger value="questions">Question Breakdown</TabsTrigger>
          <TabsTrigger value="feedback">AI Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="questions" className="space-y-3 pt-3">
          {answers.map((a, i) => (
            <Card key={a.id}>
              <CardHeader>
                <CardTitle className="text-base">Q{i + 1}: {a.questions.question_type}</CardTitle>
                <CardDescription>{a.questions.question}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <span className="text-sm">Score: {a.score ?? 0} / {a.questions.max_score}</span>
                </div>
                <div>
                  {a.is_correct === null ? (
                    <Badge variant="secondary">AI graded</Badge>
                  ) : a.is_correct ? (
                    <Badge variant="secondary">Correct</Badge>
                  ) : (
                    <Badge variant="destructive">Incorrect</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="feedback" className="space-y-3 pt-3">
          {answers.map((a, i) => {
            const text = extractFeedback(a.ai_feedback);
            const isCoding = a.questions.question_type === "coding";
            const isScenario = a.questions.question_type === "scenario";
            return (
              <Card key={a.id}>
                <CardHeader>
                  <CardTitle className="text-base">Q{i + 1}: Feedback</CardTitle>
                  <CardDescription>Type: {getTypeLabel(a.questions.question_type)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline">Score {a.score ?? 0} / {a.questions.max_score}</Badge>
                    {a.is_correct === null ? (
                      <Badge variant="secondary">AI graded</Badge>
                    ) : a.is_correct ? (
                      <Badge variant="secondary">Correct</Badge>
                    ) : (
                      <Badge variant="destructive">Incorrect</Badge>
                    )}
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                    {text}
                  </div>
                  {(isCoding || isScenario) && (
                    <div className="text-xs text-muted-foreground">Feedback is auto-generated based on the rubric.</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}

