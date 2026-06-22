import { ExperienceListEntry } from "@/components/public/experience-list-entry"
import type { Experience } from "@/types/database.helpers"

export type ExperienceListItem = Pick<
  Experience,
  "id" | "role" | "company" | "location" | "start_date" | "end_date"
>

type ExperienceListProps = {
  items: ExperienceListItem[]
}

export function ExperienceList({ items }: ExperienceListProps) {
  return (
    <div className="experience-list">
      {items.map((item) => (
        <ExperienceListEntry item={item} key={item.id} />
      ))}
    </div>
  )
}
