"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Home,
  User,
  FileText,
  ListChecks,
  Sparkles,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CandidateSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { title: "Overview", href: "/candidate", icon: Home },
    { title: "Profile", href: "/candidate/profile", icon: User },
    { title: "Resumes", href: "/candidate/resumes", icon: FileText },
    { title: "Resume Builder", href: "/candidate/resume-builder", icon: FileText },
    { title: "Applications", href: "/candidate/applications", icon: ListChecks, badge: "3" },
    { title: "Assessments", href: "/candidate/assessments", icon: Target, badge: "1" },
    { title: "Recommendations", href: "/candidate/recommendations", icon: Sparkles },
    { title: "ATS Optimization", href: "/candidate/ats-optimization-checker", icon: Sparkles },
    { title: "Settings", href: "/candidate/settings", icon: Settings },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <aside
      className={cn(
        "relative h-screen flex flex-col border-r bg-background transition-[width] duration-300 sticky top-0",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="h-16 flex items-center justify-between px-3 border-b">
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg font-semibold"
          >
            Candidate
          </motion.span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* {!isCollapsed && (
        <div className="border-b px-3 py-2">
          <Input placeholder="Search..." className="h-9" />
        </div>
      )} */}

      <TooltipProvider>
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
            {navItems.map((item) => {
              const linkEl = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isCollapsed && "mx-auto")}/>
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        className="flex-1"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {!isCollapsed && item.badge ? (
                    <Badge variant="secondary" className="ml-auto">{item.badge}</Badge>
                  ) : null}
                  {isActive(item.href) && (
                    <motion.span
                      layoutId="activeIndicator"
                      className="absolute inset-y-1 left-1 w-1 rounded bg-primary"
                    />
                  )}
                </Link>
              );
              return isCollapsed ? (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    {linkEl}
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              ) : (
                linkEl
              );
            })}
          </nav>
        </ScrollArea>
      </TooltipProvider>

      {!isCollapsed && (
        <div className="border-t p-3 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md bg-gradient-to-r from-primary/15 to-secondary/15 p-3"
          >
            <div className="text-sm font-medium mb-2">Build a standout resume</div>
            <Button size="sm" asChild>
              <Link href="/candidate/resume-builder">Open Resume Builder</Link>
            </Button>
          </motion.div>
        </div>
      )}
    </aside>
  );
}


