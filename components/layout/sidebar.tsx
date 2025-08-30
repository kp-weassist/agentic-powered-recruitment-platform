"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Brain,
  Home,
  Briefcase,
  Users,
  FileText,
  BarChart3,
  Calendar,
  MessageSquare,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Plus,
  Sparkles,
  Target,
  Building,
  Zap,
  TrendingUp
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const mainNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: Home,
      badge: null,
    },
    {
      title: "Jobs",
      href: "/jobs",
      icon: Briefcase,
      badge: "12",
      badgeVariant: "default" as const,
    },
    {
      title: "Candidates",
      href: "/candidates",
      icon: Users,
      badge: "248",
      badgeVariant: "secondary" as const,
    },
    {
      title: "Applications",
      href: "/applications",
      icon: FileText,
      badge: "36",
      badgeVariant: "outline" as const,
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      badge: null,
    },
    {
      title: "Calendar",
      href: "/calendar",
      icon: Calendar,
      badge: "5",
      badgeVariant: "destructive" as const,
    },
    {
      title: "Messages",
      href: "/messages",
      icon: MessageSquare,
      badge: "9",
      badgeVariant: "default" as const,
    },
  ];

  const aiToolsItems = [
    {
      title: "AI Matcher",
      href: "/ai-matcher",
      icon: Sparkles,
      description: "Smart candidate matching",
    },
    {
      title: "Resume Parser",
      href: "/resume-parser",
      icon: Zap,
      description: "Extract key information",
    },
    {
      title: "Skill Assessment",
      href: "/assessments",
      icon: Target,
      description: "Automated skill testing",
    },
    {
      title: "Market Insights",
      href: "/insights",
      icon: TrendingUp,
      description: "Recruitment analytics",
    },
  ];

  const bottomNavItems = [
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
    {
      title: "Help & Support",
      href: "/help",
      icon: HelpCircle,
    },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <aside
      className={cn(
        "relative flex h-screen flex-col border-r bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-sidebar-foreground">
              WeAssist
            </span>
          </Link>
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

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="border-b p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9 h-9 bg-background"
            />
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {!isCollapsed && (
            <h4 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Main Menu
            </h4>
          )}
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn("h-4 w-4", isCollapsed && "h-5 w-5")} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.badge && (
                      <Badge variant={item.badgeVariant} className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            ))}
          </nav>

          {/* AI Tools Section */}
          {!isCollapsed && (
            <>
              <h4 className="mb-2 mt-6 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                AI Tools
              </h4>
              <nav className="space-y-1">
                {aiToolsItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive(item.href)
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <div className="p-1.5 bg-primary/10 rounded group-hover:bg-primary/20 transition-colors">
                      <item.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                ))}
              </nav>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      {!isCollapsed && (
        <div className="border-t p-4">
          <Button className="w-full justify-start gap-2" size="sm">
            <Plus className="h-4 w-4" />
            Post New Job
          </Button>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="border-t p-3">
        <nav className="space-y-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn("h-4 w-4", isCollapsed && "h-5 w-5")} />
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>
      </div>

      {/* Upgrade Banner */}
      {!isCollapsed && (
        <div className="border-t p-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-gradient-to-r from-primary to-secondary p-4 text-primary-foreground"
          >
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Upgrade to Pro</span>
            </div>
            <p className="mb-3 text-xs opacity-90">
              Unlock unlimited AI matches and advanced analytics
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="w-full text-xs"
            >
              Upgrade Now
            </Button>
          </motion.div>
        </div>
      )}
    </aside>
  );
}

function Input({ className, ...props }: React.ComponentPropsWithoutRef<"input">) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}