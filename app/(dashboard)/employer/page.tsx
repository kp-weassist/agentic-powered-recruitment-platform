import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, Briefcase, Users, BarChart2, Plus } from "lucide-react";
import Link from "next/link";

export default async function EmployerDashboard() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

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
    if (userRow.role !== "employer") {
      redirect("/");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Employer Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/employer/jobs">Manage Jobs</Link>
          </Button>
          <Button asChild>
            <Link href="/employer/jobs/create">
              <Plus className="h-4 w-4 mr-2" /> Create Job
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">5</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Open Candidates</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">23</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Assessments Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">4</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Team Members</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">7</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Job Postings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applicants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { title: "Senior React Developer", status: "Open", applicants: 18 },
                  { title: "Product Designer", status: "Interviewing", applicants: 9 },
                  { title: "Data Analyst", status: "Open", applicants: 12 },
                ].map((j) => (
                  <TableRow key={j.title}>
                    <TableCell className="font-medium">{j.title}</TableCell>
                    <TableCell>
                      <Badge variant={j.status === "Open" ? "secondary" : "outline"}>{j.status}</Badge>
                    </TableCell>
                    <TableCell>{j.applicants}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/employer/jobs">Manage</Link>
                        </Button>
                        <Button size="sm" asChild>
                          <Link href="/employer/pipeline">Pipeline</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Hiring Funnel</CardTitle>
            <CardDescription>Conversion through key stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <div className="flex items-center justify-between">
                  <div>Applied → Screen</div>
                  <div>62%</div>
                </div>
                <Progress value={62} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <div>Screen → Interview</div>
                  <div>41%</div>
                </div>
                <Progress value={41} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <div>Interview → Offer</div>
                  <div>18%</div>
                </div>
                <Progress value={18} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI Suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <div>Improve JD for React role</div>
              <Button size="sm" variant="outline" asChild>
                <Link href="/employer/ai-jd-assistant">Open</Link>
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>Skills to add: Testing, Web Vitals</div>
              <Badge variant="secondary">SEO</Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Team Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>Jane moved 2 candidates to Interview</div>
            <div>Alex invited 1 recruiter</div>
            <div>Priya updated the React JD</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart2 className="h-4 w-4" /> Time to Hire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-2">Median last 30 days</div>
            <div className="text-2xl font-bold">21 days</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
