import { Icon } from "@iconify/react"
import Link from "next/link"

import {
  formatSkillProficiency,
  type SkillDetailRow,
} from "@/features/portfolio/lib/skill-usage"
import { Badge } from "@/shared/ui/badge"

export const proficiencyBadgeClass: Record<
  NonNullable<SkillDetailRow["proficiency"]>,
  string
> = {
  expert:
    "border-none bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400",
  proficient:
    "border-none bg-amber-600/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
  learning:
    "border-none bg-sky-600/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-400",
}

export function ProficiencyBadge({
  proficiency,
}: {
  proficiency: SkillDetailRow["proficiency"]
}) {
  if (!proficiency) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <Badge className={proficiencyBadgeClass[proficiency]}>
      {formatSkillProficiency(proficiency)}
    </Badge>
  )
}

export function StackTechLabel({ row }: { row: SkillDetailRow }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon
        aria-hidden
        className="size-4 shrink-0 text-foreground/70 grayscale"
        icon={row.icon}
      />
      <span className="font-medium">{row.name}</span>
    </div>
  )
}

export function UsageLinks({
  emptyLabel,
  hrefFor,
  items,
  labelFor,
}: {
  emptyLabel: string
  items: Array<{ id: string }>
  hrefFor: (item: { id: string }) => string
  labelFor: (item: { id: string }) => string
}) {
  if (items.length === 0) {
    return <span className="text-sm text-muted-foreground">{emptyLabel}</span>
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            className="text-sm text-foreground/82 transition-colors hover:text-foreground hover:underline hover:underline-offset-4"
            href={hrefFor(item)}
          >
            {labelFor(item)}
          </Link>
        </li>
      ))}
    </ul>
  )
}
