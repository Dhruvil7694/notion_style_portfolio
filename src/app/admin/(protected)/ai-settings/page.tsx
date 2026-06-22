import { AiSettingsForm } from "@/features/admin/forms/ai-settings-form"
import { getAiSettingsUncached } from "@/lib/ai/get-ai-settings"
import { getAiProvidersCatalog } from "@/lib/ai/providers/catalog"

export default async function AiSettingsPage() {
  const [settings, providersCatalog] = await Promise.all([
    getAiSettingsUncached(),
    getAiProvidersCatalog(),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Configure providers, models, failover, and context budget without redeploying.
        </p>
      </div>
      <AiSettingsForm providersCatalog={providersCatalog} settings={settings} />
    </div>
  )
}
