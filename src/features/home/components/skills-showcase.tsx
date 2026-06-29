"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useMemo } from "react"

import { SkillsChip } from "@/features/home/components/skills-chip"
import type { SkillUsageProject } from "@/features/portfolio/lib/skill-usage"
import { normalizeSkillKey } from "@/features/portfolio/lib/skills-showcase"
import { buildStackShowcaseGroups } from "@/features/portfolio/lib/stack-registry"
import { PublicEmptyState } from "@/features/site-shell/components/empty-state"
import type {
  Experience,
  Project,
  Skill,
} from "@/shared/types/database.helpers"

type SkillsShowcaseProps = {
  skills: Skill[]
  projects: Pick<Project, "id" | "slug" | "title" | "tech_stack">[]
  experience: Pick<Experience, "id" | "role" | "company" | "tech_stack">[]
}

type ShowcaseItem = {
  id: string
  label: string
  icon: string
  projects: SkillUsageProject[]
}

function mergeShowcaseItems(
  groups: ReturnType<typeof buildStackShowcaseGroups>
): ShowcaseItem[] {
  const merged = new Map<string, ShowcaseItem>()

  for (const group of groups) {
    for (const item of group.items) {
      const key = normalizeSkillKey(item.label)
      const existing = merged.get(key)

      if (!existing) {
        merged.set(key, {
          id: item.id,
          label: item.label,
          icon: item.icon,
          projects: [...item.projects],
        })
        continue
      }

      const seen = new Set(existing.projects.map((project) => project.id))
      for (const project of item.projects) {
        if (!seen.has(project.id)) {
          existing.projects.push(project)
          seen.add(project.id)
        }
      }
    }
  }

  return [...merged.values()]
}

export function SkillsShowcase({
  skills,
  projects,
  experience,
}: SkillsShowcaseProps) {
  const reduceMotion = useReducedMotion()

  const items = useMemo(
    () =>
      mergeShowcaseItems(
        buildStackShowcaseGroups({ projects, experience }, skills)
      ),
    [skills, projects, experience]
  )

  if (items.length === 0) {
    return (
      <PublicEmptyState message="Technologies will appear here once added." />
    )
  }

  function renderChips(keySuffix = "") {
    return items.map((item) => (
      <SkillsChip key={`${item.id}${keySuffix}`} {...item} />
    ))
  }

  return (
    <motion.div
      className="skills-showcase"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      viewport={{ once: true, margin: "-48px" }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
    >
      <div
        className={
          reduceMotion
            ? "skills-showcase-marquee skills-showcase-marquee-static"
            : "skills-showcase-marquee"
        }
      >
        <div className="skills-showcase-marquee-track">
          <ul className="skills-showcase-chips">{renderChips()}</ul>
          {reduceMotion ? null : (
            <ul aria-hidden="true" className="skills-showcase-chips">
              {renderChips("-dup")}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  )
}
