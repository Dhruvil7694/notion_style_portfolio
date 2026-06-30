import Link from "next/link"

import { ListEntryTitle } from "@/features/site-shell/components/list-entry-title"

type RelatedProjectCardProps = {
  body: string
  href: string
  title: string
}

export function RelatedProjectCard({
  body,
  href,
  title,
}: RelatedProjectCardProps) {
  return (
    <Link className="project-related-card" href={href}>
      <h3 className="project-related-card-title">
        <ListEntryTitle>{title}</ListEntryTitle>
      </h3>
      <p className="project-related-card-body">{body}</p>
    </Link>
  )
}
