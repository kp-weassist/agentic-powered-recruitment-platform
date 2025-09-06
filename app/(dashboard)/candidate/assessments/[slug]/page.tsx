"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Question = {
  id: string;
  question_index: number;
  question_type: "multiple_choice" | "coding" | "scenario";
  question: string;
  options: string[] | null;
  max_score: number;
  language: string | null;
  starter_code: string | null;
};

type Assessment = {
  id: string;
  title: string;
  time_limit_seconds: number;
  status: string;
  total_questions: number;
};

export default function AssessmentRunnerPage() {
  const params = useParams();
  const assessmentId = String(params?.slug);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const load = async () => {
    try {
      const { data: a, error: aErr } = await supabase
        .from("assessments")
        .select("id,title,time_limit_seconds,status,total_questions")
        .eq("id", assessmentId)
        .single();
      if (aErr) throw aErr;
      setAssessment(a as any);

      const { data: qs, error: qErr } = await supabase
        .from("assessment_questions")
        .select("id,question_index,question_type,question,options,max_score,language,starter_code")
        .eq("assessment_id", assessmentId)
        .order("question_index", { ascending: true });
      if (qErr) throw qErr;
      setQuestions((qs as any[]) ?? []);

      // Start attempt when opening
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Unauthorized");
      const { data: attempt, error: attErr } = await supabase
        .from("assessment_attempts")
        .insert({ assessment_id: assessmentId, user_id: auth.user.id })
        .select("id")
        .single();
      if (attErr) throw attErr;
      setAttemptId((attempt as any).id);
      setTimeLeft((a as any).time_limit_seconds ?? 1800);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load assessment");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((s) => (s === null ? s : s - 1)), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 0 && !submitting) {
      void submitAssessment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const q = questions[currentIdx];

  const saveAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const submitAssessment = async () => {
    try {
      if (!assessment || !attemptId) return;
      setSubmitting(true);
      const payload = {
        assessmentId: assessment.id,
        attemptId,
        timeRemainingSeconds: timeLeft ?? undefined,
        answers: questions.map((qq) => ({
          question_id: qq.id,
          question_type: qq.question_type,
          answer: answers[qq.id] ?? null,
        })),
      };
      const resp = await fetch("/api/assessments", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(json?.error || "Failed to submit");
      toast.success("Assessment submitted");
      router.push(`/candidate/assessments/${assessment.id}/result?attempt=${json.attempt_id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  if (!assessment || questions.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Assessment</h1>
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const percent = Math.round(((currentIdx + 1) / questions.length) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{assessment.title}</h1>
          <p className="text-muted-foreground text-sm">
            {questions.length} questions • {Math.round((assessment.time_limit_seconds || 0) / 60)} min
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{currentIdx + 1} / {questions.length}</Badge>
          <Badge variant="outline">{timeLeft !== null ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}` : "--:--"}</Badge>
          <Button size="sm" variant="outline" disabled={submitting} onClick={() => void submitAssessment()}>
            Submit
          </Button>
        </div>
      </div>

      <Progress value={percent} />

      <Card key={q.id}>
        <CardHeader>
          <CardTitle className="text-base">Question {currentIdx + 1}</CardTitle>
          <CardDescription>{q.question_type === "multiple_choice" ? "Multiple choice" : q.question_type === "coding" ? `Coding (${q.language || "language-agnostic"})` : "Scenario"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm whitespace-pre-wrap">{q.question}</div>

          {q.question_type === "multiple_choice" && (
            <div className="space-y-2">
              {(q.options || []).map((opt, idx) => {
                const current = answers[q.id] ?? [];
                const isMulti = true; // allow multi-select since some may have multiple correct
                const checked = Array.isArray(current) ? current.includes(idx) : current === idx;
                return (
                  <label key={idx} className="flex items-center gap-2 text-sm">
                    <input
                      type={isMulti ? "checkbox" : "radio"}
                      name={`q-${q.id}`}
                      checked={!!checked}
                      onChange={(e) => {
                        if (isMulti) {
                          let arr = Array.isArray(current) ? [...current] : [];
                          if (e.target.checked) {
                            arr.push(idx);
                          } else {
                            arr = arr.filter((n: number) => n !== idx);
                          }
                          const uniq = Array.from(new Set(arr)).sort((a, b) => a - b);
                          saveAnswer(q.id, uniq);
                        } else {
                          saveAnswer(q.id, idx);
                        }
                      }}
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          )}

          {q.question_type === "coding" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Your solution ({q.language || "code"})</label>
              <Textarea rows={12} value={answers[q.id] ?? (q.starter_code ?? "")} onChange={(e) => saveAnswer(q.id, e.target.value)} placeholder="Write your code here" />
              {q.starter_code && (
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => saveAnswer(q.id, q.starter_code!)}>
                    Reset to starter
                  </Button>
                </div>
              )}
            </div>
          )}

          {q.question_type === "scenario" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Your response</label>
              <Textarea rows={8} value={answers[q.id] ?? ""} onChange={(e) => saveAnswer(q.id, e.target.value)} placeholder="Write your response here" />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button size="sm" variant="outline" disabled={currentIdx === 0} onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}>Previous</Button>
            <div className="flex items-center gap-2 flex-wrap">
              {questions.map((qq, i) => (
                <Button key={qq.id} size="icon" variant={i === currentIdx ? "secondary" : "outline"} onClick={() => setCurrentIdx(i)}>
                  {i + 1}
                </Button>
              ))}
            </div>
            <Button size="sm" onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}>Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

