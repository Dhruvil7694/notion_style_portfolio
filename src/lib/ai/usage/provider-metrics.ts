import "server-only"

import { getAdapter, listConfiguredProviders } from "../providers"
import type { AiProviderId } from "../providers/base"

export type ProviderHealthStatus = {
  provider: AiProviderId
  configured: boolean
  healthy: boolean
  latencyMs?: number
  error?: string
}

export async function checkAllProviderHealth(): Promise<ProviderHealthStatus[]> {
  const providers = await listConfiguredProviders()
  const results: ProviderHealthStatus[] = []

  for (const provider of providers) {
    const adapter = getAdapter(provider)
    const health = await adapter.healthCheck()
    results.push({
      provider,
      configured: true,
      healthy: health.ok,
      latencyMs: health.latencyMs,
      error: health.error,
    })
  }

  return results
}
