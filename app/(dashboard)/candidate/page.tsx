import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sparkles, FileText, Briefcase, Target } from "lucide-react";
import Link from "next/link";

export default async function CandidateDashboard() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // Ensure onboarding complete and correct role
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (uid) {
    const { data: userRow } = await supabase
      .from("users")
      .select("role,is_onboarding_completed")
      .eq("id", uid)
      .maybeSingle();
    if (!userRow || !userRow.is_onboarding_completed) {
      redirect("/onboarding");
    }
    if (userRow.role !== "candidate") {
      redirect("/");
    }
  }

  // Real data snapshots for key features
  let resumesCount = 0;
  let editableResumesCount = 0;
  let assessmentsCount = 0;
  let attemptsInProgressCount = 0;
  let jdAnalysesCount = 0;
  let atsAnalysesCount = 0;
  let profilePct = 0;
  let profileTodos: string[] = [];
  try {
    const [resumesQ, editableQ, assessmentsQ, attemptsQ, jdQ, atsQ, profileQ] =
      await Promise.all([
        supabase
          .from("resumes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid as string)
          .eq("is_deleted", false),
        supabase
          .from("resumes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid as string)
          .eq("is_deleted", false)
          .not("resume_data", "is", null),
        supabase
          .from("assessments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid as string),
        supabase
          .from("assessment_attempts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid as string)
          .eq("status", "in_progress"),
        supabase
          .from("resume_jd_analysis_history")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid as string),
        supabase
          .from("resumes")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid as string)
          .eq("is_deleted", false)
          .not("ats_optimization_checker_results", "is", null),
        supabase
          .from("candidate_profiles")
          .select(
            "full_name,resume_url,skills,experience,education,projects,location,desired_salary"
          )
          .eq("user_id", uid as string)
          .maybeSingle(),
      ]);
    resumesCount = Number((resumesQ as any)?.count || 0);
    editableResumesCount = Number((editableQ as any)?.count || 0);
    assessmentsCount = Number((assessmentsQ as any)?.count || 0);
    attemptsInProgressCount = Number((attemptsQ as any)?.count || 0);
    jdAnalysesCount = Number((jdQ as any)?.count || 0);
    atsAnalysesCount = Number((atsQ as any)?.count || 0);

    const profile = (profileQ as any)?.data || null;
    if (profile) {
      const checks: Array<[boolean, string]> = [
        [
          typeof profile.full_name === "string" &&
            profile.full_name.trim().length > 0,
          "Add your name",
        ],
        [
          typeof profile.location === "string" &&
            profile.location.trim().length > 0,
          "Add location",
        ],
        [
          typeof profile.resume_url === "string" &&
            profile.resume_url.trim().length > 0,
          "Upload resume",
        ],
        [
          Array.isArray(profile.skills) && profile.skills.length > 0,
          "Add skills",
        ],
        [
          Array.isArray(profile.education) && profile.education.length > 0,
          "Add education",
        ],
        [
          Array.isArray(profile.experience) && profile.experience.length > 0,
          "Add experience",
        ],
        [
          Array.isArray(profile.projects) && profile.projects.length > 0,
          "Add projects",
        ],
      ];
      const total = checks.length;
      const completed = checks.filter((c) => c[0]).length;
      profilePct = Math.round((completed / Math.max(1, total)) * 100);
      profileTodos = checks
        .filter((c) => !c[0])
        .map((c) => c[1])
        .slice(0, 3);
    }
  } catch {
    // best-effort fallback to zeros
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Candidate Dashboard
        </h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Link href="/candidate/resumes">Upload Resume</Link>
          </Button>
          <Button>
            <Link href="/candidate/recommendations">Get Recommendations</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Resumes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {resumesCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Editable Resumes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {editableResumesCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Assessments
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {assessmentsCount}
            {/* {attemptsInProgressCount > 0 ? (
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                • {attemptsInProgressCount} in progress
              </span>
            ) : null} */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jdAnalysesCount + atsAnalysesCount}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              JD {jdAnalysesCount} • ATS {atsAnalysesCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    role: "Frontend Engineer",
                    company: "Acme Corp",
                    status: "Under Review",
                  },
                  {
                    role: "Product Designer",
                    company: "Designly",
                    status: "Interview",
                  },
                  {
                    role: "Data Analyst",
                    company: "InsightX",
                    status: "Submitted",
                  },
                ].map((a) => (
                  <TableRow key={`${a.role}-${a.company}`}>
                    <TableCell className="font-medium">{a.role}</TableCell>
                    <TableCell>{a.company}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-2">
              Your profile is {profilePct || 0}% complete
            </div>
            <Progress value={profilePct || 0} />
            <div className="mt-4 space-y-2">
              {(profileTodos.length > 0
                ? profileTodos
                : ["Add summary", "Upload resume", "Confirm education"]
              ).map((t) => (
                <div
                  key={t}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> {t}
                  </div>
                  <Button size="sm" variant="ghost">
                    <Link href={`/candidate/profile`}>Do it</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" /> Upcoming Assessments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div>JavaScript Fundamentals</div>
              <Badge variant="outline">Due in 2d</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div>Problem Solving</div>
              <Badge variant="secondary">Scheduled</Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Recommended Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                title: "Senior React Developer",
                company: "TechWave",
                score: 92,
              },
              { title: "UI Engineer", company: "FlowUI", score: 88 },
            ].map((j) => (
              <div key={j.title} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{j.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {j.company} • Match Score {j.score}%
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                  <Button size="sm">Apply</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
