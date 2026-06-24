import {
  SKILL_DB_CATEGORY_LABELS,
  type SkillDetailRow,
} from "@/lib/public/skill-usage"
import { SKILLS_SHOWCASE_ORDER } from "@/lib/public/skills-showcase"
import type { Skill } from "@/types/database.helpers"

export type StackFilterState = {
  query: string
  category: SkillDetailRow["category"] | null
  dbCategory: Skill["category"] | null
  proficiency: Skill["proficiency"] | null
}

export const EMPTY_STACK_FILTERS: StackFilterState = {
  query: "",
  category: null,
  dbCategory: null,
  proficiency: null,
}

export type StackFilterOptions = {
  categories: SkillDetailRow["category"][]
  dbCategories: Skill["category"][]
  proficiencies: NonNullable<Skill["proficiency"]>[]
}

export function buildStackFilterOptions(
  rows: SkillDetailRow[]
): StackFilterOptions {
  const categories = new Set<SkillDetailRow["category"]>()
  const dbCategories = new Set<Skill["category"]>()
  const proficiencies = new Set<NonNullable<Skill["proficiency"]>>()

  for (const row of rows) {
    categories.add(row.category)
    if (row.dbCategory) dbCategories.add(row.dbCategory)
    if (row.proficiency) proficiencies.add(row.proficiency)
  }

  return {
    categories: SKILLS_SHOWCASE_ORDER.filter((category) =>
      categories.has(category)
    ),
    dbCategories: (
      Object.keys(SKILL_DB_CATEGORY_LABELS) as Skill["category"][]
    ).filter((category) => dbCategories.has(category)),
    proficiencies: (["expert", "proficient", "learning"] as const).filter(
      (level) => proficiencies.has(level)
    ),
  }
}

export function filterStackRows(
  rows: SkillDetailRow[],
  filters: StackFilterState
): SkillDetailRow[] {
  const query = filters.query.trim().toLowerCase()

  return rows.filter((row) => {
    if (query && !row.name.toLowerCase().includes(query)) {
      return false
    }

    if (filters.category && row.category !== filters.category) {
      return false
    }

    if (filters.dbCategory && row.dbCategory !== filters.dbCategory) {
      return false
    }

    if (filters.proficiency && row.proficiency !== filters.proficiency) {
      return false
    }

    return true
  })
}

export function countActiveStackFilters(filters: StackFilterState): number {
  let count = 0
  if (filters.query.trim()) count += 1
  if (filters.category) count += 1
  if (filters.dbCategory) count += 1
  if (filters.proficiency) count += 1
  return count
}

export function hasActiveStackFilters(filters: StackFilterState): boolean {
  return countActiveStackFilters(filters) > 0
}
