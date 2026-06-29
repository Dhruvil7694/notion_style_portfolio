import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  Bug,
  Cpu,
  Eye,
  FileText,
  FolderKanban,
  Gauge,
  Globe,
  GraduationCap,
  HeartPulse,
  IdCard,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  MessageSquareQuote,
  Rocket,
  ScrollText,
  SearchCheck,
  Server,
  Settings,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trophy,
  User,
  UserCircle,
  Wrench,
} from "lucide-react"
import type { SVGProps } from "react"

import { PostHogIcon, SentryIcon } from "@/shared/ui/brand-icons"

export type NavIcon =
  | LucideIcon
  | ((
      props: SVGProps<SVGSVGElement> & { className?: string }
    ) => React.JSX.Element)

export type AdminNavItem = {
  title: string
  href: string
  icon: NavIcon
  description?: string
}

export type AdminNavGroup = {
  id: string
  title: string
  icon: NavIcon
  items: AdminNavItem[]
}

export const adminDashboardNavItem: AdminNavItem = {
  title: "Dashboard",
  href: "/admin",
  icon: LayoutDashboard,
  description: "Overview and summary metrics",
}

export const adminSettingsNavItem: AdminNavItem = {
  title: "Settings",
  href: "/admin/settings",
  icon: Settings,
  description: "Social links, contact details, and appearance",
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    id: "core",
    title: "Core",
    icon: FolderKanban,
    items: [
      {
        title: "Projects",
        href: "/admin/projects",
        icon: Briefcase,
        description: "Manage portfolio projects",
      },
      {
        title: "Content",
        href: "/admin/content",
        icon: FileText,
        description: "Blogs, research, automation, and notes",
      },
      {
        title: "Experience",
        href: "/admin/experience",
        icon: BookOpen,
        description: "Work history and roles",
      },
      {
        title: "Expertise",
        href: "/admin/expertise",
        icon: Brain,
        description: "Knowledge graph expertise domains",
      },
      {
        title: "Technologies",
        href: "/admin/technologies",
        icon: Cpu,
        description: "Technology knowledge hub registry",
      },
      {
        title: "Concepts",
        href: "/admin/concepts",
        icon: Lightbulb,
        description: "Concept authority pages for GEO",
      },
      {
        title: "Skills",
        href: "/admin/skills",
        icon: Wrench,
        description: "Skill taxonomy and proficiency",
      },
      {
        title: "Education",
        href: "/admin/education",
        icon: GraduationCap,
        description: "Degrees and institutions",
      },
      {
        title: "Resume",
        href: "/admin/resume",
        icon: ScrollText,
        description: "Resume versions and uploads",
      },
    ],
  },
  {
    id: "profile",
    title: "Profile",
    icon: UserCircle,
    items: [
      {
        title: "Profile",
        href: "/admin/profile",
        icon: User,
        description: "Homepage photo, name, and bio",
      },
      {
        title: "About Me",
        href: "/admin/about",
        icon: IdCard,
        description: "About page photo and long-form copy",
      },
    ],
  },
  {
    id: "ai",
    title: "AI",
    icon: Sparkles,
    items: [
      {
        title: "AI Settings",
        href: "/admin/ai-settings",
        icon: SlidersHorizontal,
        description: "Provider, model, and routing configuration",
      },
      {
        title: "Copilot",
        href: "/admin/copilot",
        icon: Bot,
        description: "AI portfolio architect",
      },
      {
        title: "AI Usage",
        href: "/admin/ai",
        icon: Gauge,
        description: "Provider usage, tokens, and cost tracking",
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: LineChart,
    items: [
      {
        title: "Job Fit Analytics",
        href: "/admin/job-fit-analytics",
        icon: Target,
        description: "JD validations, fit scores, and recruiter actions",
      },
      {
        title: "Content Health",
        href: "/admin/content-health",
        icon: HeartPulse,
        description: "Audit content completeness and SEO readiness",
      },
    ],
  },
  {
    id: "visibility",
    title: "Visibility",
    icon: Eye,
    items: [
      {
        title: "SEO Audit",
        href: "/admin/seo",
        icon: SearchCheck,
        description: "SEO quality scores and fix suggestions",
      },
      {
        title: "AEO",
        href: "/admin/aeo",
        icon: MessageSquareQuote,
        description:
          "Answer Engine Optimization — appear in AI and voice answers",
      },
      {
        title: "GEO",
        href: "/admin/geo",
        icon: Globe,
        description:
          "Generative Engine Optimization — feed LLM knowledge graphs",
      },
    ],
  },
  {
    id: "admin",
    title: "Admin",
    icon: Shield,
    items: [
      {
        title: "Launch",
        href: "/admin/launch",
        icon: Rocket,
        description: "Pre-deployment readiness checklist",
      },
      {
        title: "System",
        href: "/admin/system",
        icon: Server,
        description: "Live system health checks",
      },
      {
        title: "Launch Report",
        href: "/admin/launch-report",
        icon: Trophy,
        description: "Final launch readiness score and recommendation",
      },
    ],
  },
  {
    id: "debug",
    title: "Debug",
    icon: Bug,
    items: [
      {
        title: "Sentry",
        href: "/admin/debug/sentry",
        icon: SentryIcon,
        description: "Fire test Sentry events to verify monitoring",
      },
      {
        title: "PostHog",
        href: "/admin/debug/analytics",
        icon: PostHogIcon,
        description: "Verify PostHog events and view live analytics",
      },
    ],
  },
]

/** Flat list of all nav items (dashboard + grouped items + settings). */
export const adminNavigation: AdminNavItem[] = [
  adminDashboardNavItem,
  ...adminNavGroups.flatMap((group) => group.items),
  adminSettingsNavItem,
]

export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin"
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function getAdminNavGroupForPath(
  pathname: string
): AdminNavGroup | null {
  return (
    adminNavGroups.find((group) =>
      group.items.some((item) => isAdminNavActive(pathname, item.href))
    ) ?? null
  )
}
