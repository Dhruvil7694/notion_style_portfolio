import "server-only"

import { createAdminClient } from "@/shared/lib/supabase/admin"

export const ADMIN_PAGE_SIZE = 50

export type AdminListParams = {
  q?: string
  status?: string
  page?: number
}

// Admin routes are already gated by requireAdmin() at the middleware/layout level.
// Use service role here so draft content is always readable in admin UIs.
function getSupabase() {
  return createAdminClient()
}

function listRange(page = 1) {
  const from = (page - 1) * ADMIN_PAGE_SIZE
  return { from, to: from + ADMIN_PAGE_SIZE - 1 }
}

export type DashboardRecentProject = {
  id: string
  title: string
  status: string
  updated_at: string
}

export type DashboardRecentContent = {
  id: string
  title: string
  type: string
  status: string
  updated_at: string
}

export async function getDashboardStats() {
  const supabase = await getSupabase()

  const [
    projectsResult,
    contentResult,
    experienceResult,
    skillsResult,
    educationResult,
    resumesResult,
    recentProjectsResult,
    recentContentResult,
    skillsCategoryResult,
  ] = await Promise.all([
    supabase.from("projects").select("status", { count: "exact" }),
    supabase.from("content").select("type, status", { count: "exact" }),
    supabase.from("experience").select("id", { count: "exact", head: true }),
    supabase.from("skills").select("id", { count: "exact", head: true }),
    supabase.from("education").select("id", { count: "exact", head: true }),
    supabase
      .from("resumes")
      .select("version, is_active, uploaded_at")
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id, title, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("content")
      .select("id, title, type, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase.from("skills").select("category"),
  ])

  const projects = projectsResult.data ?? []
  const content = contentResult.data ?? []
  const resumes = resumesResult.data ?? []
  const recentProjects = (recentProjectsResult.data ??
    []) as DashboardRecentProject[]
  const recentContent = (recentContentResult.data ??
    []) as DashboardRecentContent[]
  const skillsCategories = (skillsCategoryResult.data ?? []) as {
    category: string
  }[]

  const countByStatus = (rows: { status: string }[]) => ({
    total: rows.length,
    published: rows.filter((row) => row.status === "published").length,
    draft: rows.filter((row) => row.status === "draft").length,
    archived: rows.filter((row) => row.status === "archived").length,
  })

  const countByType = (type: string) =>
    content.filter((row) => row.type === type).length

  const activeResume = resumes.find((row) => row.is_active)

  const categoryMap = new Map<string, number>()
  for (const row of skillsCategories) {
    const cat = row.category ?? "other"
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1)
  }
  const skillsByCategory = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  const contentPublished = content.filter(
    (r) => r.status === "published"
  ).length
  const contentPublishedRate =
    content.length > 0
      ? Math.round((contentPublished / content.length) * 100)
      : 0

  return {
    projects: countByStatus(projects),
    content: {
      total: content.length,
      blog: countByType("blog"),
      research: countByType("research"),
      automation: countByType("automation"),
      note: countByType("note"),
      publication: countByType("publication"),
      byStatus: {
        published: contentPublished,
        draft: content.filter((r) => r.status === "draft").length,
        archived: content.filter((r) => r.status === "archived").length,
      },
    },
    contentPublishedRate,
    experience: experienceResult.count ?? 0,
    skills: skillsResult.count ?? 0,
    education: educationResult.count ?? 0,
    resume: {
      total: resumes.length,
      currentVersion: activeResume?.version ?? null,
      lastUploadDate:
        activeResume?.uploaded_at ?? resumes[0]?.uploaded_at ?? null,
    },
    recentProjects,
    recentContent,
    skillsByCategory,
    errors: [
      projectsResult.error,
      contentResult.error,
      experienceResult.error,
      skillsResult.error,
      educationResult.error,
      resumesResult.error,
      recentProjectsResult.error,
      recentContentResult.error,
      skillsCategoryResult.error,
    ].filter(Boolean),
  }
}

export async function getProjectById(id: string) {
  const supabase = await getSupabase()
  return supabase.from("projects").select("*").eq("id", id).maybeSingle()
}

export async function getContentById(id: string) {
  const supabase = await getSupabase()
  return supabase.from("content").select("*").eq("id", id).maybeSingle()
}

export async function getExperienceById(id: string) {
  const supabase = await getSupabase()
  return supabase.from("experience").select("*").eq("id", id).maybeSingle()
}

export async function getSkillById(id: string) {
  const supabase = await getSupabase()
  return supabase.from("skills").select("*").eq("id", id).maybeSingle()
}

export async function getEducationById(id: string) {
  const supabase = await getSupabase()
  return supabase.from("education").select("*").eq("id", id).maybeSingle()
}

export async function getProjectsList(params: AdminListParams = {}) {
  const supabase = await getSupabase()
  const { from, to } = listRange(params.page)

  let query = supabase
    .from("projects")
    .select("id, title, status, display_order, updated_at", { count: "exact" })
    .order("display_order", { ascending: true })
    .order("updated_at", { ascending: false })
    .range(from, to)

  if (params.q) {
    query = query.ilike("title", `%${params.q}%`)
  }

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }

  return query
}

export async function getAllProjectsForOrder() {
  const supabase = await getSupabase()

  return supabase
    .from("projects")
    .select("id, title, status, display_order, updated_at")
    .order("display_order", { ascending: true })
    .order("updated_at", { ascending: false })
    .limit(500)
}

export async function getContentList(params: AdminListParams = {}) {
  const supabase = await getSupabase()
  const { from, to } = listRange(params.page)

  let query = supabase
    .from("content")
    .select("id, title, type, status, published_at, updated_at", {
      count: "exact",
    })
    .order("updated_at", { ascending: false })
    .range(from, to)

  if (params.q) {
    query = query.ilike("title", `%${params.q}%`)
  }

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }

  return query
}

export async function getExperienceList(params: AdminListParams = {}) {
  const supabase = await getSupabase()
  const { from, to } = listRange(params.page)

  let query = supabase
    .from("experience")
    .select(
      "id, company, role, start_date, end_date, display_order, updated_at",
      {
        count: "exact",
      }
    )
    .order("display_order", { ascending: true })
    .range(from, to)

  if (params.q) {
    query = query.or(`role.ilike.%${params.q}%,company.ilike.%${params.q}%`)
  }

  return query
}

export async function getSkillsList(params: AdminListParams = {}) {
  const supabase = await getSupabase()
  const { from, to } = listRange(params.page)

  let query = supabase
    .from("skills")
    .select("id, category, name, proficiency, display_order, show_on_landing", {
      count: "exact",
    })
    .order("display_order", { ascending: true })
    .range(from, to)

  if (params.q) {
    query = query.ilike("name", `%${params.q}%`)
  }

  return query
}

export async function getEducationList(params: AdminListParams = {}) {
  const supabase = await getSupabase()
  const { from, to } = listRange(params.page)

  let query = supabase
    .from("education")
    .select("id, institution, degree, start_date, end_date, updated_at", {
      count: "exact",
    })
    .order("updated_at", { ascending: false })
    .range(from, to)

  if (params.q) {
    query = query.or(
      `institution.ilike.%${params.q}%,degree.ilike.%${params.q}%`
    )
  }

  return query
}

export async function getResumesList() {
  const supabase = await getSupabase()
  return supabase
    .from("resumes")
    .select("id, version, is_active, file_path, uploaded_at")
    .order("uploaded_at", { ascending: false })
}

export async function getSettingsList() {
  const supabase = await getSupabase()
  return supabase
    .from("settings")
    .select("key, updated_at")
    .order("key", { ascending: true })
}

export async function getExpertiseAreasList(params: AdminListParams = {}) {
  const supabase = await getSupabase()
  const { from, to } = listRange(params.page)

  let query = supabase
    .from("expertise_areas")
    .select("*", { count: "exact" })
    .order("display_order", { ascending: true })
    .range(from, to)

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,slug.ilike.%${params.q}%`)
  }

  return query
}

export async function getTechnologiesList(params: AdminListParams = {}) {
  const supabase = await getSupabase()
  const { from, to } = listRange(params.page)

  let query = supabase
    .from("technology_registry")
    .select("*", { count: "exact" })
    .order("display_order", { ascending: true })
    .range(from, to)

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,slug.ilike.%${params.q}%`)
  }

  return query
}

export async function getConceptsList(params: AdminListParams = {}) {
  const supabase = await getSupabase()
  const { from, to } = listRange(params.page)

  let query = supabase
    .from("concept_registry")
    .select("*", { count: "exact" })
    .order("display_order", { ascending: true })
    .range(from, to)

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,slug.ilike.%${params.q}%`)
  }

  return query
}

export async function getAdminSettings() {
  const supabase = await getSupabase()
  return supabase
    .from("settings")
    .select("key, value")
    .in("key", [
      "site_settings",
      "social_links",
      "contact_info",
      "about_content",
    ])
}
