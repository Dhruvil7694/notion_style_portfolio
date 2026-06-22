import { inferSkillCategory } from "@/lib/admin/sync-skills-from-tech-stack"
import {
  findExperienceForTechName,
  findProjectsForTechName,
  type SkillDetailRow,
  type SkillUsageExperience,
  type SkillUsageProject,
} from "@/lib/public/skill-usage"
import {
  normalizeSkillKey,
  resolveShowcaseCategory,
  resolveShowcaseIcon,
  SKILLS_SHOWCASE_ORDER,
  type SkillsShowcaseCategory,
  type SkillsShowcaseItem,
} from "@/lib/public/skills-showcase"
import type { Experience, Project, Skill } from "@/types/database.helpers"

export type StackProjectSource = Pick<Project, "id" | "slug" | "title" | "tech_stack"> &
  Partial<Pick<Project, "summary" | "tagline" | "impact" | "icon_name">>

export type StackTechSource = {
  projects: StackProjectSource[]
  experience: Pick<Experience, "id" | "role" | "company" | "tech_stack">[]
}

export type StackEntry = {
  id: string
  name: string
  label: string
  icon: string
  category: SkillsShowcaseCategory
  dbCategory: Skill["category"] | null
  proficiency: Skill["proficiency"]
  showOnLanding: boolean
  skillId: string | null
  projects: SkillUsageProject[]
  experience: SkillUsageExperience[]
}

function registerTechnologyName(
  names: Map<string, string>,
  value: string
) {
  const trimmed = value.trim()
  if (!trimmed) return

  const key = normalizeSkillKey(trimmed)
  if (!names.has(key)) {
    names.set(key, trimmed)
  }
}

export function collectStackTechnologyNames(
  sources: StackTechSource
): string[] {
  const names = new Map<string, string>()

  for (const project of sources.projects) {
    for (const tech of project.tech_stack ?? []) {
      registerTechnologyName(names, tech)
    }
  }

  for (const entry of sources.experience) {
    for (const tech of entry.tech_stack ?? []) {
      registerTechnologyName(names, tech)
    }
  }

  return [...names.values()].sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: "base" })
  )
}

export function findSkillMetadata(
  techName: string,
  skills: Skill[]
): Skill | undefined {
  const key = normalizeSkillKey(techName)

  return skills.find((skill) => normalizeSkillKey(skill.name) === key)
}

function resolveEntryCategory(
  techName: string,
  skill: Skill | undefined
): SkillsShowcaseCategory {
  if (skill) {
    return resolveShowcaseCategory(skill)
  }

  return resolveShowcaseCategory({
    category: inferSkillCategory(techName),
  } as Skill)
}

function buildStackEntryId(techName: string, skill: Skill | undefined): string {
  return skill?.id ?? `tech:${normalizeSkillKey(techName)}`
}

export function buildStackEntries(
  sources: StackTechSource,
  skills: Skill[],
  options?: { landingOnly?: boolean }
): StackEntry[] {
  const techNames = collectStackTechnologyNames(sources)

  return techNames
    .map((techName) => {
      const skill = findSkillMetadata(techName, skills)
      const showOnLanding = skill?.show_on_landing ?? false

      return {
        id: buildStackEntryId(techName, skill),
        name: techName,
        label: techName.trim(),
        icon: resolveShowcaseIcon(skill?.name ?? techName, techName.trim()),
        category: resolveEntryCategory(techName, skill),
        dbCategory: skill?.category ?? inferSkillCategory(techName),
        proficiency: skill?.proficiency ?? null,
        showOnLanding,
        skillId: skill?.id ?? null,
        projects: findProjectsForTechName(techName, sources.projects),
        experience: findExperienceForTechName(techName, sources.experience),
      }
    })
    .filter((entry) => !options?.landingOnly || entry.showOnLanding)
}

function dedupeShowcaseItems(
  items: StackShowcaseGroup["items"]
): StackShowcaseGroup["items"] {
  const seen = new Set<string>()
  const result: StackShowcaseGroup["items"] = []

  for (const item of items) {
    const key = normalizeSkillKey(item.label)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(item)
  }

  return result
}

export type StackShowcaseGroup = {
  category: SkillsShowcaseCategory
  items: Array<
    SkillsShowcaseItem & {
      projects: SkillUsageProject[]
      experience: SkillUsageExperience[]
    }
  >
}

export function buildStackShowcaseGroups(
  sources: StackTechSource,
  skills: Skill[]
): StackShowcaseGroup[] {
  const buildGroups = (landingOnly: boolean) => {
    const entries = buildStackEntries(sources, skills, { landingOnly })
    const buckets = Object.fromEntries(
      SKILLS_SHOWCASE_ORDER.map((category) => [category, [] as StackShowcaseGroup["items"]])
    ) as Record<SkillsShowcaseCategory, StackShowcaseGroup["items"]>

    for (const entry of entries) {
      buckets[entry.category].push({
        id: entry.id,
        label: entry.label,
        icon: entry.icon,
        projects: entry.projects,
        experience: entry.experience,
      })
    }

    return SKILLS_SHOWCASE_ORDER.map((category) => ({
      category,
      items: dedupeShowcaseItems(buckets[category]),
    })).filter((group) => group.items.length > 0)
  }

  const curated = buildGroups(true)
  if (curated.length > 0) {
    return curated
  }

  return buildGroups(false)
}

export function buildSkillDetailRows(
  skills: Skill[],
  projects: Pick<Project, "id" | "slug" | "title" | "tech_stack">[],
  experience: Experience[]
): SkillDetailRow[] {
  return buildStackEntries({ projects, experience }, skills).map((entry) => ({
    id: entry.id,
    name: entry.name,
    label: entry.label,
    icon: entry.icon,
    category: entry.category,
    dbCategory: entry.dbCategory,
    proficiency: entry.proficiency,
    projects: entry.projects,
    experience: entry.experience,
  }))
}
