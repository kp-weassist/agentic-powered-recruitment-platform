import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sparkles, FileText, Briefcase, Target } from "lucide-react";

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

  return (
   <div className="space-y-6">
     <div className="flex items-center justify-between">
       <h1 className="text-2xl font-semibold tracking-tight">Candidate Dashboard</h1>
       <div className="flex gap-2">
         <Button variant="outline">Upload Resume</Button>
         <Button>
           <Sparkles className="h-4 w-4 mr-2" /> Get Recommendations
         </Button>
       </div>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
       <Card>
         <CardHeader className="pb-2">
           <CardTitle className="text-sm text-muted-foreground">Applications</CardTitle>
         </CardHeader>
         <CardContent className="text-2xl font-bold">6</CardContent>
       </Card>
       <Card>
         <CardHeader className="pb-2">
           <CardTitle className="text-sm text-muted-foreground">Interviews</CardTitle>
         </CardHeader>
         <CardContent className="text-2xl font-bold">2</CardContent>
       </Card>
       <Card>
         <CardHeader className="pb-2">
           <CardTitle className="text-sm text-muted-foreground">Assessments Pending</CardTitle>
         </CardHeader>
         <CardContent className="text-2xl font-bold">1</CardContent>
       </Card>
       <Card>
         <CardHeader className="pb-2">
           <CardTitle className="text-sm text-muted-foreground">New Matches</CardTitle>
         </CardHeader>
         <CardContent className="text-2xl font-bold">14</CardContent>
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
               {[{ role: "Frontend Engineer", company: "Acme Corp", status: "Under Review" }, { role: "Product Designer", company: "Designly", status: "Interview" }, { role: "Data Analyst", company: "InsightX", status: "Submitted" }].map((a) => (
                 <TableRow key={`${a.role}-${a.company}`}>
                   <TableCell className="font-medium">{a.role}</TableCell>
                   <TableCell>{a.company}</TableCell>
                   <TableCell>
                     <Badge variant="secondary">{a.status}</Badge>
                   </TableCell>
                   <TableCell className="text-right">
                     <Button size="sm" variant="outline">View</Button>
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
           <div className="text-sm text-muted-foreground mb-2">Your profile is 72% complete</div>
           <Progress value={72} />
           <div className="mt-4 space-y-2">
             {["Add summary", "Upload resume", "Confirm education"].map((t) => (
               <div key={t} className="flex items-center justify-between text-sm">
                 <div className="flex items-center gap-2">
                   <FileText className="h-4 w-4" /> {t}
                 </div>
                 <Button size="sm" variant="ghost">Do it</Button>
               </div>
             ))}
           </div>
         </CardContent>
       </Card>
     </div>

     <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2"><Target className="h-4 w-4" /> Upcoming Assessments</CardTitle>
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
           <CardTitle className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Recommended Jobs</CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           {[{ title: "Senior React Developer", company: "TechWave", score: 92 }, { title: "UI Engineer", company: "FlowUI", score: 88 }].map((j) => (
             <div key={j.title} className="flex items-center justify-between">
               <div>
                 <div className="font-medium">{j.title}</div>
                 <div className="text-sm text-muted-foreground">{j.company} • Match Score {j.score}%</div>
               </div>
               <div className="flex gap-2">
                 <Button size="sm" variant="outline">View</Button>
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
