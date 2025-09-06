"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Row = {
  id: string;
  submitted_at: string | null;
  score_total: number | null;
  assessments: { id: string; title: string; time_limit_seconds: number; total_questions: number } | null;
};

export default function AssessmentsHistoryPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxScore, setMaxScore] = useState<number | null>(null);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        setRows([]);
        setMaxScore(null);
        return;
      }
      const { data, error } = await supabase
        .from("assessment_attempts")
        .select("id,submitted_at,score_total,report,assessments:assessment_id(id,title,time_limit_seconds,total_questions)")
        .eq("user_id", userId)
        .eq("status", "graded")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      const maxScore = Math.max(...(data as any[] ?? []).map((r) => r.report?.overall?.max_score ?? 0));
      setMaxScore(maxScore);
      setRows(((data as any[]) ?? []).sort((a, b) => {
        const aScore = a.report?.overall?.score ?? 0;
        const bScore = b.report?.overall?.score ?? 0;
        return bScore - aScore;
      }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Assessment History</h1>
        <p className="text-muted-foreground">Your recent attempts and scores.</p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">No attempts yet.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const title = r.assessments?.title ?? "Assessment";
            const dt = r.submitted_at ? new Date(r.submitted_at).toLocaleString() : "In progress";
            return (
              <Card key={r.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span className="truncate">{title}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Attempt {r.id.slice(0, 8)}</Badge>
                      <span className="text-xs text-muted-foreground">{dt}</span>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    {typeof r.score_total === "number" ? (
                      <div className="flex items-center gap-3">
                        <div className="text-sm">Score: {r.score_total}</div>
                        <Progress value={Math.min(100, Math.max(0, Number(r.score_total / (maxScore ?? 1)))) * 100} />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not graded yet</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" onClick={() => router.push(`/candidate/assessments/${r.assessments?.id}/result?attempt=${r.id}`)}>
                    View Result
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


