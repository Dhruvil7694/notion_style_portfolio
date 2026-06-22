"use client"

import { Icon } from "@iconify/react"

import {
  EXPERIENCE_STACK_ORDER,
  type ExperienceStackGroups,
  resolveTechStackIcon,
} from "@/lib/public/experience-tech-stack"

type ExperienceTechStackProps = {
  groups: ExperienceStackGroups
}

export function ExperienceTechStack({ groups }: ExperienceTechStackProps) {
  const visibleGroups = EXPERIENCE_STACK_ORDER.filter((key) => groups[key].length > 0)

  if (visibleGroups.length === 0) {
    return <p className="case-study-paragraph">Tech stack details coming soon.</p>
  }

  return (
    <div className="experience-tech-groups">
      {visibleGroups.map((category) => (
        <section className="experience-tech-group" key={category}>
          <h3 className="experience-tech-group-title">{category}</h3>
          <ul className="experience-tech-items">
            {groups[category].map((item) => (
              <li className="experience-tech-item" key={`${category}-${item}`}>
                <Icon
                  aria-hidden
                  className="experience-tech-item-icon"
                  icon={resolveTechStackIcon(item)}
                />
                <span className="experience-tech-item-label">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
