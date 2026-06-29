import "server-only"

import { maskSecret } from "../provider-keys/crypto"
import { aiTelemetry } from "../sentry-telemetry"
import { createLanguageModel } from "./adapters"
import type { AiProviderId, HealthCheckResult } from "./base"
import { probeNvidiaApiKey } from "./nvidia-api"
import { PROVIDER_CONFIGS } from "./registry"

export type ValidateProviderKeyResult = HealthCheckResult & {
  maskedKey?: string
}

export async function validateProviderApiKey(
  provider: AiProviderId,
  apiKey: string
): Promise<ValidateProviderKeyResult> {
  const trimmed = apiKey.trim()

  if (!trimmed) {
    return { ok: false, error: "API key is required" }
  }

  const start = Date.now()

  if (provider === "nvidia") {
    const result = await probeNvidiaApiKey(trimmed)
    return {
      ok: result.ok,
      latencyMs: Date.now() - start,
      maskedKey: result.ok ? maskSecret(trimmed) : undefined,
      error: result.error,
    }
  }

  try {
    const modelId = PROVIDER_CONFIGS[provider].defaultModels.fast
    const model = createLanguageModel(provider, modelId, trimmed)
    const { generateText } = await import("ai")

    await generateText({
      model,
      prompt: "ping",
      maxOutputTokens: 16,
      ...aiTelemetry("provider-key-validation"),
    })

    return {
      ok: true,
      latencyMs: Date.now() - start,
      maskedKey: maskSecret(trimmed),
    }
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Validation failed",
    }
  }
}
