import { Suspense } from "react"

import { SearchPageClient } from "@/features/discovery/components/search-page-client"
import { PageShell } from "@/features/knowledge-base/components/content-shell"
import { getPublicSettings } from "@/features/portfolio/lib/queries"
import { buildBaseMetadata } from "@/features/seo/lib/metadata"

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const [{ q }, settings] = await Promise.all([
    searchParams,
    getPublicSettings(),
  ])
  const query = q?.trim()

  return buildBaseMetadata(
    { settings },
    {
      title: query ? `Search: ${query}` : "Search",
      description:
        "Search projects, research, writing, automations, expertise, technologies, and concepts.",
      path: query ? `/search?q=${encodeURIComponent(query)}` : "/search",
      noIndex: Boolean(query),
    }
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams

  return (
    <PageShell
      description="Unified search across the portfolio knowledge graph."
      title="Search"
    >
      <Suspense
        fallback={<p className="discovery-search-empty">Loading search...</p>}
      >
        <SearchPageClient initialQuery={q ?? ""} />
      </Suspense>
    </PageShell>
  )
}
