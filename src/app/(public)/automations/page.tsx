import { AutomationList } from "@/features/automations/components/automation-list"
import { PageShell } from "@/features/knowledge-base/components/content-shell"
import {
  getPublicSettings,
  getPublishedContent,
} from "@/features/portfolio/lib/queries"
import { buildAutomationsIndexMetadata } from "@/features/seo/lib"

export async function generateMetadata() {
  const settings = await getPublicSettings()

  return buildAutomationsIndexMetadata({ settings })
}

export default async function AutomationsPage() {
  const { data: items } = await getPublishedContent({ type: "automation" })

  return (
    <PageShell
      description="Automation systems, workflows, and applied AI tooling."
      title="Automations"
    >
      {items.length > 0 ? (
        <AutomationList items={items} />
      ) : (
        <p className="kb-empty-message">
          Automations will appear here once published.
        </p>
      )}
    </PageShell>
  )
}
