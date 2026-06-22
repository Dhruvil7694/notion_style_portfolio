import { AutomationList } from "@/components/public/automation-list"
import { PageShell } from "@/components/public/content-shell"
import { getPublicSettings, getPublishedContent } from "@/lib/public/queries"
import { buildAutomationsIndexMetadata } from "@/lib/seo"

export async function generateMetadata() {
  const settings = await getPublicSettings()

  return buildAutomationsIndexMetadata({ settings })
}

export default async function AutomationsPage() {
  const { data: items } = await getPublishedContent({ type: "automation" })

  return (
    <PageShell description="Automation systems, workflows, and applied AI tooling." title="Automations">
      {items.length > 0 ? (
        <AutomationList items={items} />
      ) : (
        <p className="kb-empty-message">Automations will appear here once published.</p>
      )}
    </PageShell>
  )
}
