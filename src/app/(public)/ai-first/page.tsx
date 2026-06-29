import { AiFirstPageContent } from "@/features/ai-first/components/ai-first-page-content"
import { PageShell } from "@/features/knowledge-base/components/content-shell"
import { getPublicSettings } from "@/features/portfolio/lib/queries"
import { createPageMetadata } from "@/shared/lib/utils/metadata"

export async function generateMetadata() {
  const settings = await getPublicSettings()
  const owner = settings.site.owner_name || settings.site.site_name

  return createPageMetadata({
    title: "AI First Approach",
    description: `${owner} on AI-first engineering with MCP servers, agent skills, custom pipelines, RAG, evals, and production automation workflows.`,
    path: "/ai-first",
    siteName: settings.site.site_name,
    siteUrl: settings.site.site_url,
  })
}

export default function AiFirstPage() {
  return (
    <PageShell
      className="max-w-home"
      description="Practical playbooks for automating email, research, code delivery, and support with agents, MCPs, and custom pipelines."
      title="AI First Approach"
    >
      <AiFirstPageContent />
    </PageShell>
  )
}
