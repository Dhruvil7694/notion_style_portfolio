import "server-only"

import { getAdminMutationClient } from "@/lib/admin/actions/client"

import type { AiProviderId } from "../providers/base"
import { estimateCost } from "./cost-estimator"

export type UsageLogEntry = {
  provider: AiProviderId
  model: string
  role: "public" | "copilot" | "generation"
  inputTokens: number
  outputTokens: number
  latencyMs: number
  success: boolean
  error?: string
}

export async function trackAiUsage(entry: UsageLogEntry): Promise<void> {
  const costEstimate = estimateCost(
    entry.provider,
    entry.model,
    entry.inputTokens,
    entry.outputTokens
  )

  try {
    const supabase = await getAdminMutationClient()
    await supabase.from("ai_usage_logs" as "projects").insert({
      provider: entry.provider,
      model: entry.model,
      role: entry.role,
      input_tokens: entry.inputTokens,
      output_tokens: entry.outputTokens,
      cost_estimate: costEstimate,
      latency_ms: entry.latencyMs,
      success: entry.success,
      error_message: entry.error ?? null,
    } as never)
  } catch (err) {
    console.error("[track-usage]", err)
  }
}
