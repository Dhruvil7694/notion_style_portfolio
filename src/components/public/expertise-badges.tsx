import Link from "next/link"

type ExpertiseBadgesProps = {
  slugs: string[]
  titlesBySlug?: Record<string, string>
}

export function ExpertiseBadges({ slugs, titlesBySlug = {} }: ExpertiseBadgesProps) {
  const items = slugs.filter(Boolean)

  if (items.length === 0) {
    return null
  }

  return (
    <ul className="expertise-badges">
      {items.map((slug) => (
        <li key={slug}>
          <Link className="expertise-badge" href={`/expertise/${slug}`}>
            {titlesBySlug[slug] ?? slug.replace(/-/g, " ")}
          </Link>
        </li>
      ))}
    </ul>
  )
}
