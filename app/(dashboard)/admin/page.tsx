import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Briefcase, Building2, Activity, Shield, BarChart2 } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
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
    if (userRow.role !== "admin") {
      redirect("/");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/users">Manage Users</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/system">System Status</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">1,247</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Organizations</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">128</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">342</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Assessments Today</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">57</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { user: "jane@example.com", role: "employer", org: "Acme" },
                  { user: "alex@example.com", role: "candidate", org: "—" },
                  { user: "maya@example.com", role: "employer", org: "FlowUI" },
                ].map((u) => (
                  <TableRow key={u.user}>
                    <TableCell className="font-medium">{u.user}</TableCell>
                    <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                    <TableCell>{u.org}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/admin/users">View</Link>
                        </Button>
                        <Button size="sm" asChild>
                          <Link href="/admin/roles">Role</Link>
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
            <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4" /> System Health</CardTitle>
            <CardDescription>Uptime and error rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <div className="flex items-center justify-between">
                  <div>Uptime</div>
                  <div>99.98%</div>
                </div>
                <Progress value={99} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <div>API Error Rate</div>
                  <div>0.3%</div>
                </div>
                <Progress value={30} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Role Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>3 pending admin role requests</div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/roles">Open Roles</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Organization Approvals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>2 new companies awaiting verification</div>
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin/organizations">Review</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart2 className="h-4 w-4" /> Platform Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-2">Requests / min</div>
            <div className="text-2xl font-bold">12,431</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
