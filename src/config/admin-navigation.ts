import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  Bot,
  Brain,
  Briefcase,
  FileText,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Settings,
  Sparkles,
  User,
  UserCircle,
} from "lucide-react"

export type AdminNavItem = {
  title: string
  href: string
  icon: LucideIcon
  description?: string
}

export const adminNavigation: AdminNavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Overview and summary metrics",
  },
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
    icon: Layers,
    description: "Technology knowledge hub registry",
  },
  {
    title: "Concepts",
    href: "/admin/concepts",
    icon: Sparkles,
    description: "Concept authority pages for GEO",
  },
  {
    title: "Skills",
    href: "/admin/skills",
    icon: Sparkles,
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
    icon: Layers,
    description: "Resume versions and uploads",
  },
  {
    title: "Profile",
    href: "/admin/profile",
    icon: User,
    description: "Homepage photo, name, and bio",
  },
  {
    title: "About Me",
    href: "/admin/about",
    icon: UserCircle,
    description: "About page photo and long-form copy",
  },
  {
    title: "AI Settings",
    href: "/admin/ai-settings",
    icon: Sparkles,
    description: "Provider, model, and routing configuration",
  },
  {
    title: "Copilot",
    href: "/admin/copilot",
    icon: Bot,
    description: "AI portfolio architect",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "Social links and contact details",
  },
]

export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin"
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}
