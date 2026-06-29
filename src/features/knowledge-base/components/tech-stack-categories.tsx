"use client"

import { Icon } from "@iconify/react"

import { resolveTechStackIcon } from "@/features/portfolio/lib/experience-tech-stack"
import type { ProjectTechStackGroup } from "@/features/portfolio/lib/project-case-study"

type TechStackCategoriesProps = {
  groups: ProjectTechStackGroup[]
}

export function TechStackCategories({ groups }: TechStackCategoriesProps) {
  if (groups.length === 0) {
    return null
  }

  return (
    <div className="case-study-tech-groups">
      {groups.map((group) => (
        <section className="case-study-tech-group" key={group.category}>
          <h3 className="case-study-tech-group-title">{group.category}</h3>
          <ul className="case-study-tech-group-list">
            {group.items.map((item) => (
              <li className="case-study-tech-chip" key={item}>
                <Icon
                  aria-hidden
                  className="case-study-tech-chip-icon"
                  icon={resolveTechStackIcon(item)}
                />
                <span className="case-study-tech-chip-label">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
