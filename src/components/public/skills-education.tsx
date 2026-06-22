import { formatDateRange } from "@/lib/utils/date"
import type { Education, Skill } from "@/types/database.helpers"

const SKILL_CATEGORY_LABELS: Record<Skill["category"], string> = {
  language: "Languages",
  framework: "Frameworks",
  tool: "Tools",
  cloud: "Cloud",
  ai_ml: "AI / ML",
  soft: "Soft Skills",
  other: "Other",
}

type SkillsGridProps = {
  skills: Skill[]
}

export function SkillsGrid({ skills }: SkillsGridProps) {
  if (skills.length === 0) {
    return <p className="text-muted-foreground text-sm">No skills listed yet.</p>
  }

  const grouped = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const label = SKILL_CATEGORY_LABELS[skill.category] ?? skill.category
    acc[label] = acc[label] ?? []
    acc[label].push(skill)
    return acc
  }, {})

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category}>
          <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            {category}
          </h3>
          <ul className="space-y-2">
            {items.map((skill) => (
              <li
                className="text-foreground flex items-baseline justify-between gap-4 text-sm"
                key={skill.id}
              >
                <span>{skill.name}</span>
                {skill.proficiency ? (
                  <span className="text-muted-foreground text-xs capitalize">
                    {skill.proficiency.replace("_", " ")}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

type EducationListProps = {
  items: Education[]
}

export function EducationList({ items }: EducationListProps) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">No education entries yet.</p>
  }

  return (
    <ol className="space-y-6">
      {items.map((item) => (
        <li className="border-border border-b pb-6 last:border-b-0" key={item.id}>
          <p className="text-foreground font-medium">{item.degree}</p>
          <p className="text-muted-foreground mt-1 text-sm">{item.institution}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            {formatDateRange(item.start_date, item.end_date)}
          </p>
          {item.description ? (
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
              {item.description}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
