import "server-only"

import { generateText } from "ai"

import { getAiSettings } from "./get-ai-settings"
import { resolveModelChain } from "./providers/router"
import { trackAiUsage } from "./usage/track-usage"

export async function generateWithFailover(prompt: string, system?: string): Promise<string> {
  const settings = await getAiSettings()
  const chain = await resolveModelChain("copilot")
  const errors: string[] = []

  for (const entry of chain) {
    const start = Date.now()
    try {
      const { text, usage } = await generateText({
        model: entry.model,
        system,
        prompt,
        temperature: settings.temperature,
        maxOutputTokens: settings.max_tokens,
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
      errors.push(`${entry.provider}: ${error instanceof Error ? error.message : "failed"}`)
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
    }
  }

  throw new Error(
    errors.length > 0 ? "All AI providers failed." : "No AI provider is configured."
  )
}
