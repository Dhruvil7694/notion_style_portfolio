import "server-only"

import { getAiSettings } from "../get-ai-settings"
import { resolveProviderKeysMap } from "../provider-keys"
import type { AiSettings } from "../settings"
import { createLanguageModel } from "./adapters"
import type { AiProviderId, AiRole, ResolvedModel } from "./base"
import { PROVIDER_CONFIGS } from "./registry"

export type ProviderChainEntry = ResolvedModel & {
  role: AiRole
}

const DEFAULT_FAILOVER_ORDER: AiProviderId[] = [
  "openai",
  "anthropic",
  "gemini",
  "openrouter",
  "groq",
  "nvidia",
]

function resolveForRole(
  settings: AiSettings,
  role: AiRole
): { provider: AiProviderId; modelId: string } {
  if (role === "public") {
    return {
      provider: settings.public_provider,
      modelId: settings.public_model,
    }
  }
  if (role === "copilot") {
    return {
      provider: settings.copilot_provider,
      modelId: settings.copilot_model,
    }
  }
  if (role === "visibility") {
    return {
      provider: settings.visibility_provider,
      modelId: settings.visibility_model,
    }
  }
  return {
    provider: settings.fallback_provider,
    modelId: settings.fallback_model,
  }
}

export async function buildProviderChain(
  role: AiRole,
  settings: AiSettings
): Promise<ProviderChainEntry[]> {
  const keys = await resolveProviderKeysMap()
  const primary = resolveForRole(settings, role)
  const fallback = resolveForRole(settings, "fallback")

  const orderedProviders = [
    primary.provider,
    fallback.provider,
    ...DEFAULT_FAILOVER_ORDER.filter(
      (provider) =>
        provider !== primary.provider && provider !== fallback.provider
    ),
  ]

  const chain: ProviderChainEntry[] = []

  for (const provider of orderedProviders) {
    const apiKey = keys[provider]
    if (!apiKey) continue

    const modelId =
      provider === primary.provider
        ? primary.modelId
        : provider === fallback.provider
          ? fallback.modelId
          : PROVIDER_CONFIGS[provider].defaultModels[
              role === "copilot" ? "strong" : "fast"
            ]

    try {
      chain.push({
        role,
        provider,
        modelId,
        model: createLanguageModel(provider, modelId, apiKey),
      })
    } catch (err) {
      console.error(
        "[provider-router] skipping misconfigured provider:",
        provider,
        err
      )
    }
  }

  return chain
}

export async function resolveModelChain(
  role: AiRole
): Promise<ProviderChainEntry[]> {
  const settings = await getAiSettings()
  return buildProviderChain(role, settings)
}

export async function resolvePrimaryModel(
  role: AiRole
): Promise<ProviderChainEntry> {
  const chain = await resolveModelChain(role)
  if (chain.length === 0) {
    throw new Error(
      "No AI provider is configured. Add an API key in AI Settings or environment variables."
    )
  }
  return chain[0]!
}

export async function listConfiguredProviders(): Promise<AiProviderId[]> {
  const keys = await resolveProviderKeysMap()
  return (Object.keys(PROVIDER_CONFIGS) as AiProviderId[]).filter((provider) =>
    Boolean(keys[provider])
  )
}

export async function getRoutingSettings() {
  return getAiSettings()
}
