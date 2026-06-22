import "server-only"

import { getProviderKeyStatus, type ProviderKeySource } from "../provider-keys"
import type { AiProviderId } from "./base"
import { getModelsForProvider, getProviderEnvKey, PROVIDER_CONFIGS } from "./registry"

export type AiProviderCatalogEntry = {
  id: AiProviderId
  label: string
  envKey: string
  configured: boolean
  source: ProviderKeySource
  maskedKey: string | null
  models: {
    id: string
    label: string
    tier: string
  }[]
}

export async function getAiProvidersCatalog(): Promise<AiProviderCatalogEntry[]> {
  return Promise.all(
    Object.values(PROVIDER_CONFIGS).map(async (config) => {
      const status = await getProviderKeyStatus(config.id)

      return {
        id: config.id,
        label: config.label,
        envKey: getProviderEnvKey(config.id),
        configured: status.configured,
        source: status.source,
        maskedKey: status.maskedKey ?? null,
        models: getModelsForProvider(config.id).map((model) => ({
          id: model.id,
          label: model.label,
          tier: model.tier,
        })),
      }
    })
  )
}
