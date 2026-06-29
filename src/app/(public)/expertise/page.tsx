import { PageShell } from "@/features/knowledge-base/components/content-shell"
import { ExpertiseAreaCard } from "@/features/knowledge-base/components/expertise-area-card"
import {
  getPublicSettings,
  getPublishedExpertiseAreas,
} from "@/features/portfolio/lib/queries"
import { buildBaseMetadata } from "@/features/seo/lib/metadata"

export async function generateMetadata() {
  const settings = await getPublicSettings()

  return buildBaseMetadata(
    { settings },
    {
      title: "Expertise",
      description:
        "Applied AI engineering domains — RAG systems, multi-agent workflows, document intelligence, and enterprise automation.",
      path: "/expertise",
    }
  )
}

export default async function ExpertiseIndexPage() {
  const { data: areas } = await getPublishedExpertiseAreas()

  return (
    <PageShell
      description="Authority pages connecting projects, research, writing, and automations by engineering domain."
      title="Expertise"
    >
      {areas && areas.length > 0 ? (
        <ul className="expertise-index-list">
          {areas.map((area) => (
            <li key={area.id}>
              <ExpertiseAreaCard area={area} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="kb-empty-message">
          Expertise areas will appear here once published.
        </p>
      )}
    </PageShell>
  )
}
