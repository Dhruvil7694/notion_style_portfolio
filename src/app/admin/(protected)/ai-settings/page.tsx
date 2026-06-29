import { PageHeader } from "@/features/admin/components"
import { AiSettingsForm } from "@/features/admin/components/forms/ai-settings-form"
import { getAiSettingsUncached } from "@/features/ai/lib/get-ai-settings"
import { getAiProvidersCatalog } from "@/features/ai/lib/providers/catalog"

export const dynamic = "force-dynamic"

export default async function AiSettingsPage() {
  const [settings, providersCatalog] = await Promise.all([
    getAiSettingsUncached(),
    getAiProvidersCatalog(),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        description="Configure providers, models, failover, and context budget without redeploying."
        title="AI Settings"
      />
      <AiSettingsForm providersCatalog={providersCatalog} settings={settings} />
    </div>
  )
}
