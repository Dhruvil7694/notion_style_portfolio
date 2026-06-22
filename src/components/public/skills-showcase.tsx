"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useMemo } from "react"

import { PublicEmptyState } from "@/components/public/empty-state"
import { SkillsChip } from "@/components/public/skills-chip"
import type { SkillsShowcaseCategory } from "@/lib/public/skills-showcase"
import { buildStackShowcaseGroups } from "@/lib/public/stack-registry"
import type { Experience, Project, Skill } from "@/types/database.helpers"

type SkillsShowcaseProps = {
  skills: Skill[]
  projects: Pick<Project, "id" | "slug" | "title" | "tech_stack">[]
  experience: Pick<Experience, "id" | "role" | "company" | "tech_stack">[]
}

function SkillsMarqueeRow({
  animate,
  items,
}: {
  animate: boolean
  items: ReturnType<typeof buildStackShowcaseGroups>[number]["items"]
}) {
  const chips = items.map((item) => <SkillsChip key={item.id} {...item} />)

  if (!animate) {
    return (
      <div className="skills-showcase-row-static">
        <ul className="skills-showcase-chips">{chips}</ul>
      </div>
    )
  }

  return (
    <div className="skills-showcase-marquee">
      <div className="skills-showcase-marquee-track">
        <ul className="skills-showcase-chips">{chips}</ul>
        <ul aria-hidden className="skills-showcase-chips">
          {items.map((item) => (
            <SkillsChip key={`${item.id}-duplicate`} {...item} />
          ))}
        </ul>
      </div>
    </div>
  )
}

export function SkillsShowcase({
  skills,
  projects,
  experience,
}: SkillsShowcaseProps) {
  const reduceMotion = useReducedMotion()
  const groups = useMemo(
    () => buildStackShowcaseGroups({ projects, experience }, skills),
    [skills, projects, experience]
  )

  if (groups.length === 0) {
    return <PublicEmptyState message="Technologies will appear here once added." />
  }

  return (
    <div className="skills-showcase">
      {groups.map((group, index) => (
        <motion.div
          className="skills-showcase-row"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          key={group.category as SkillsShowcaseCategory}
          transition={{ duration: 0.35, delay: index * 0.07, ease: "easeOut" }}
          viewport={{ once: true, margin: "-48px" }}
          whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        >
          <SkillsMarqueeRow animate={!reduceMotion} items={group.items} />
        </motion.div>
      ))}
    </div>
  )
}
