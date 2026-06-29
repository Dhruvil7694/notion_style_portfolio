import { PageShell } from "@/features/knowledge-base/components/content-shell"
import {
  getPublicSettings,
  getPublishedContent,
} from "@/features/portfolio/lib/queries"
import { ResearchList } from "@/features/research/components/research-list"
import { buildResearchIndexMetadata } from "@/features/seo/lib"

export async function generateMetadata() {
  const settings = await getPublicSettings()

  return buildResearchIndexMetadata({ settings })
}

export default async function ResearchPage() {
  const { data: items } = await getPublishedContent({ type: "research" })

  return (
    <PageShell
      description="Applied AI research, papers, and technical notes."
      title="Research"
    >
      {items.length > 0 ? (
        <ResearchList items={items} />
      ) : (
        <p className="kb-empty-message">
          Research will appear here once published.
        </p>
      )}
    </PageShell>
  )
}
