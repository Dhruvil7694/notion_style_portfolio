"use client"

import { Icon } from "@iconify/react"
import { useEffect, useMemo, useState } from "react"

import { resolveTechStackIcon } from "@/features/portfolio/lib/experience-tech-stack"
import type { ProjectTechStackGroup } from "@/features/portfolio/lib/project-case-study"

type TechStackCategoriesProps = {
  groups: ProjectTechStackGroup[]
}

export function flattenTechStackItems(
  groups: ProjectTechStackGroup[]
): string[] {
  const seen = new Set<string>()
  const items: string[] = []

  for (const group of groups) {
    for (const item of group.items) {
      const key = item.trim().toLowerCase()
      if (!key || seen.has(key)) {
        continue
      }
      seen.add(key)
      items.push(item)
    }
  }

  return items
}

export function TechStackCategories({ groups }: TechStackCategoriesProps) {
  const [reduceMotion, setReduceMotion] = useState(false)
  const items = useMemo(() => flattenTechStackItems(groups), [groups])

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduceMotion(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  if (items.length === 0) {
    return null
  }

  function renderChips(keySuffix = "") {
    return items.map((item) => (
      <li className="case-study-tech-chip" key={`${item}${keySuffix}`}>
        <Icon
          aria-hidden
          className="case-study-tech-chip-icon"
          icon={resolveTechStackIcon(item)}
        />
        <span className="case-study-tech-chip-label">{item}</span>
      </li>
    ))
  }

  return (
    <div
      className={
        reduceMotion
          ? "case-study-tech-marquee case-study-tech-marquee-static"
          : "case-study-tech-marquee"
      }
    >
      <div className="case-study-tech-marquee-track">
        <ul className="case-study-tech-marquee-list">{renderChips()}</ul>
        {reduceMotion ? null : (
          <ul aria-hidden="true" className="case-study-tech-marquee-list">
            {renderChips("-dup")}
          </ul>
        )}
      </div>
    </div>
  )
}
