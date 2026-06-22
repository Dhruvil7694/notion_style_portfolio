export type AdminResourceKey =
  | "projects"
  | "content"
  | "experience"
  | "expertise"
  | "technologies"
  | "concepts"
  | "skills"
  | "education"

type AdminResourceRoutes = {
  list: string
  new: string
  edit: (id: string) => string
  label: string
}

export const adminResourceRoutes: Record<AdminResourceKey, AdminResourceRoutes> = {
  projects: {
    list: "/admin/projects",
    new: "/admin/projects/new",
    edit: (id) => `/admin/projects/${id}`,
    label: "Project",
  },
  content: {
    list: "/admin/content",
    new: "/admin/content/new",
    edit: (id) => `/admin/content/${id}`,
    label: "Content",
  },
  experience: {
    list: "/admin/experience",
    new: "/admin/experience/new",
    edit: (id) => `/admin/experience/${id}`,
    label: "Experience",
  },
  expertise: {
    list: "/admin/expertise",
    new: "/admin/expertise/new",
    edit: (id) => `/admin/expertise/${id}`,
    label: "Expertise",
  },
  technologies: {
    list: "/admin/technologies",
    new: "/admin/technologies/new",
    edit: (id) => `/admin/technologies/${id}`,
    label: "Technologies",
  },
  concepts: {
    list: "/admin/concepts",
    new: "/admin/concepts/new",
    edit: (id) => `/admin/concepts/${id}`,
    label: "Concepts",
  },
  skills: {
    list: "/admin/skills",
    new: "/admin/skills/new",
    edit: (id) => `/admin/skills/${id}`,
    label: "Skill",
  },
  education: {
    list: "/admin/education",
    new: "/admin/education/new",
    edit: (id) => `/admin/education/${id}`,
    label: "Education",
  },
}

export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin"
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}
