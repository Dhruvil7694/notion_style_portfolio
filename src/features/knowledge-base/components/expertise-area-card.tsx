import Link from "next/link"

import type { ExpertiseArea } from "@/shared/types/database.helpers"

type ExpertiseAreaCardProps = {
  area: Pick<
    ExpertiseArea,
    "slug" | "title" | "summary" | "description" | "featured"
  >
}

export function ExpertiseAreaCard({ area }: ExpertiseAreaCardProps) {
  const description = area.summary?.trim() || area.description?.trim()

  return (
    <Link className="expertise-index-card" href={`/expertise/${area.slug}`}>
      <h2 className="expertise-index-card-title">{area.title}</h2>
      {description ? (
        <p className="expertise-index-card-description">{description}</p>
      ) : null}
    </Link>
  )
}
