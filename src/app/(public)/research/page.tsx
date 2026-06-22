import { PageShell } from "@/components/public/content-shell"
import { ResearchList } from "@/components/public/research-list"
import { getPublicSettings, getPublishedContent } from "@/lib/public/queries"
import { buildResearchIndexMetadata } from "@/lib/seo"

export async function generateMetadata() {
  const settings = await getPublicSettings()

  return buildResearchIndexMetadata({ settings })
}

export default async function ResearchPage() {
  const { data: items } = await getPublishedContent({ type: "research" })

  return (
    <PageShell description="Applied AI research, papers, and technical notes." title="Research">
      {items.length > 0 ? (
        <ResearchList items={items} />
      ) : (
        <p className="kb-empty-message">Research will appear here once published.</p>
      )}
    </PageShell>
  )
}
