import type { AiProviderId } from "../providers/base"
import { getModelConfig } from "../providers/registry"

export function estimateCost(
  provider: AiProviderId,
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const config = getModelConfig(modelId)
  const inputRate = config?.capabilities.costPer1kInput ?? 0.001
  const outputRate = config?.capabilities.costPer1kOutput ?? 0.002

  return (inputTokens / 1000) * inputRate + (outputTokens / 1000) * outputRate
}
