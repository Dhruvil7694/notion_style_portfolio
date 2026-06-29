import "server-only"

import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { createOpenAI } from "@ai-sdk/openai"
import type { LanguageModel } from "ai"

import { resolveProviderKey, resolveProviderKeysMap } from "../provider-keys"
import { aiTelemetry } from "../sentry-telemetry"
import type { AiProviderAdapter, AiProviderId, HealthCheckResult } from "./base"
import { probeNvidiaApiKey } from "./nvidia-api"
import {
  getModelsForProvider,
  MODEL_REGISTRY,
  PROVIDER_CONFIGS,
} from "./registry"

function createOpenAiCompatibleModel(
  providerId: "openai" | "groq" | "openrouter" | "nvidia",
  modelId: string,
  apiKey: string
): LanguageModel {
  const config = PROVIDER_CONFIGS[providerId]

  const openai = createOpenAI({
    apiKey,
    baseURL: config.baseUrl,
    ...(providerId === "openrouter"
      ? {
          headers: {
            "HTTP-Referer": process.env.SITE_URL ?? "http://localhost:3000",
            "X-Title": "Portfolio CMS",
          },
        }
      : {}),
  })

  return openai(modelId)
}

export function createLanguageModel(
  providerId: AiProviderId,
  modelId: string,
  apiKey: string
): LanguageModel {
  switch (providerId) {
    case "openai":
    case "groq":
    case "openrouter":
    case "nvidia":
      return createOpenAiCompatibleModel(providerId, modelId, apiKey)
    case "anthropic":
      return createAnthropic({ apiKey })(modelId)
    case "gemini":
      return createGoogleGenerativeAI({ apiKey })(modelId)
    default:
      throw new Error(`Unsupported provider: ${providerId satisfies never}`)
  }
}

function buildAdapter(id: AiProviderId): AiProviderAdapter {
  return {
    id,
    isConfigured: () => {
      throw new Error("Use isProviderKeyConfigured() for async key resolution.")
    },
    modelList: () => getModelsForProvider(id),
    createModel: () => {
      throw new Error("Use createLanguageModel() with a resolved API key.")
    },
    async healthCheck(): Promise<HealthCheckResult> {
      const apiKey = await resolveProviderKey(id)
      if (!apiKey) {
        return { ok: false, error: "API key not configured" }
      }

      const start = Date.now()
      try {
        if (id === "nvidia") {
          const probe = await probeNvidiaApiKey(apiKey)
          return probe.ok
            ? { ok: true, latencyMs: Date.now() - start }
            : {
                ok: false,
                latencyMs: Date.now() - start,
                error: probe.error ?? "Health check failed",
              }
        }

        const modelId = PROVIDER_CONFIGS[id].defaultModels.fast
        const model = createLanguageModel(id, modelId, apiKey)
        const { generateText } = await import("ai")
        await generateText({
          model,
          prompt: "ping",
          maxOutputTokens: 16,
          ...aiTelemetry("provider-health-check"),
        })
        return { ok: true, latencyMs: Date.now() - start }
      } catch (error) {
        return {
          ok: false,
          latencyMs: Date.now() - start,
          error: error instanceof Error ? error.message : "Health check failed",
        }
      }
    },
  }
}

export const openaiAdapter = buildAdapter("openai")
export const anthropicAdapter = buildAdapter("anthropic")
export const geminiAdapter = buildAdapter("gemini")
export const groqAdapter = buildAdapter("groq")
export const openrouterAdapter = buildAdapter("openrouter")
export const nvidiaAdapter = buildAdapter("nvidia")

export const PROVIDER_ADAPTERS: Record<AiProviderId, AiProviderAdapter> = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  gemini: geminiAdapter,
  groq: groqAdapter,
  openrouter: openrouterAdapter,
  nvidia: nvidiaAdapter,
}

export function getAdapter(providerId: AiProviderId): AiProviderAdapter {
  return PROVIDER_ADAPTERS[providerId]
}

export function listAllModels() {
  return MODEL_REGISTRY
}

export async function listConfiguredProviderIds(): Promise<AiProviderId[]> {
  const keys = await resolveProviderKeysMap()
  return (Object.keys(PROVIDER_ADAPTERS) as AiProviderId[]).filter((provider) =>
    Boolean(keys[provider])
  )
}
