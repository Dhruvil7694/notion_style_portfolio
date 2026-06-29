import "server-only"

import { generateText } from "ai"

import { logger } from "@/shared/lib/monitoring/logger"

import { getAiSettings } from "./get-ai-settings"
import { resolveModelChain } from "./providers/router"
import { aiTelemetry } from "./sentry-telemetry"
import { trackAiUsage } from "./usage/track-usage"

export async function generateWithFailover(
  prompt: string,
  system?: string,
  role: import("./providers/base").AiRole = "copilot"
): Promise<string> {
  const settings = await getAiSettings()
  const chain = await resolveModelChain(role)
  const errors: string[] = []

  for (const entry of chain) {
    const start = Date.now()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20_000)
    try {
      const { text, usage } = await generateText({
        model: entry.model,
        system,
        prompt,
        temperature: settings.temperature,
        maxOutputTokens: settings.max_tokens,
        abortSignal: controller.signal,
        ...aiTelemetry("generate-with-failover"),
      })

      void trackAiUsage({
        provider: entry.provider,
        model: entry.modelId,
        role: "generation",
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        latencyMs: Date.now() - start,
        success: true,
      })

      return text
    } catch (error) {
      const msg = error instanceof Error ? error.message : "failed"
      errors.push(`${entry.provider}: ${msg}`)
      logger.error("[generate] provider failed", {
        provider: entry.provider,
        model: entry.modelId,
        error: msg,
      })
      void trackAiUsage({
        provider: entry.provider,
        model: entry.modelId,
        role: "generation",
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - start,
        success: false,
        error: error instanceof Error ? error.message : "Generation failed",
      })
    } finally {
      clearTimeout(timeout)
    }
  }

  throw new Error(
    errors.length > 0
      ? "All AI providers failed."
      : "No AI provider is configured."
  )
}
