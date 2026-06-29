import { varianceLevel } from "@/features/admin/lib/ai-cost-verification"
import { getModelConfig } from "@/features/ai/lib/providers/registry"

export const AI_COST_EPSILON = 0.000001

export type AiCostBreakdownLine = {
  label: string
  formula: string
  amount: string
}

export type AiUsageCostBreakdown = {
  inputTokens: number
  outputTokens: number
  inputRatePer1k: number
  outputRatePer1k: number
  inputCost: number
  outputCost: number
  computedCost: number
  storedCost: number
  matches: boolean
  varianceUsd: number
  variancePct: number | null
  rateSource: "registry" | "fallback"
  modelLabel: string | null
  lines: AiCostBreakdownLine[]
}

export type AiUsageLogRow = {
  id: string
  provider: string
  model: string
  role: string
  inputTokens: number
  outputTokens: number
  costEstimate: number
  latencyMs: number
  success: boolean
  errorMessage: string | null
  createdAt: string
}

export type AiUsageLogWithBreakdown = AiUsageLogRow & {
  breakdown: AiUsageCostBreakdown
}

export type AiCostVerificationProvider = {
  provider: string
  queryCount: number
  storedCost: number
  computedCost: number
  varianceUsd: number
  variancePct: number
  mismatches: number
  dashboardUrl: string | null
}

export type AiCostVerificationResult = {
  days: number
  totalQueries: number
  matchedQueries: number
  mismatchedQueries: number
  totalStoredCost: number
  totalComputedCost: number
  varianceUsd: number
  variancePct: number
  status: "ok" | "warn" | "error"
  byProvider: AiCostVerificationProvider[]
  sampleMismatches: AiUsageLogWithBreakdown[]
  verifiedAt: string
}

function formatUsd(value: number, digits = 6): string {
  return `$${value.toFixed(digits)}`
}

function formatRate(value: number): string {
  return `$${value.toFixed(6)} / 1K`
}

function variancePct(stored: number, computed: number): number {
  if (computed === 0) {
    return stored === 0 ? 0 : 100
  }
  return (Math.abs(stored - computed) / computed) * 100
}

export function buildAiUsageCostBreakdown(
  row: Pick<
    AiUsageLogRow,
    "model" | "inputTokens" | "outputTokens" | "costEstimate"
  >
): AiUsageCostBreakdown {
  const config = getModelConfig(row.model)
  const inputRatePer1k = config?.capabilities.costPer1kInput ?? 0.001
  const outputRatePer1k = config?.capabilities.costPer1kOutput ?? 0.002
  const inputCost = (row.inputTokens / 1000) * inputRatePer1k
  const outputCost = (row.outputTokens / 1000) * outputRatePer1k
  const computedCost = inputCost + outputCost
  const storedCost = row.costEstimate
  const varianceUsd = Math.abs(storedCost - computedCost)
  const matches = varianceUsd <= AI_COST_EPSILON

  const lines: AiCostBreakdownLine[] = [
    {
      label: "Input tokens",
      formula: row.inputTokens.toLocaleString(),
      amount: "—",
    },
    {
      label: "Input rate",
      formula: formatRate(inputRatePer1k),
      amount: "—",
    },
    {
      label: "Input cost",
      formula: `(${row.inputTokens} ÷ 1000) × ${inputRatePer1k}`,
      amount: formatUsd(inputCost),
    },
    {
      label: "Output tokens",
      formula: row.outputTokens.toLocaleString(),
      amount: "—",
    },
    {
      label: "Output rate",
      formula: formatRate(outputRatePer1k),
      amount: "—",
    },
    {
      label: "Output cost",
      formula: `(${row.outputTokens} ÷ 1000) × ${outputRatePer1k}`,
      amount: formatUsd(outputCost),
    },
    {
      label: "Total computed",
      formula: "Input cost + Output cost",
      amount: formatUsd(computedCost),
    },
    {
      label: "Stored in log",
      formula: "cost_estimate column",
      amount: formatUsd(storedCost),
    },
    {
      label: "Variance",
      formula: "|stored − computed|",
      amount: matches
        ? formatUsd(0)
        : `${formatUsd(varianceUsd)} (${variancePct(storedCost, computedCost).toFixed(2)}%)`,
    },
  ]

  return {
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    inputRatePer1k,
    outputRatePer1k,
    inputCost,
    outputCost,
    computedCost,
    storedCost,
    matches,
    varianceUsd,
    variancePct: matches ? 0 : variancePct(storedCost, computedCost),
    rateSource: config ? "registry" : "fallback",
    modelLabel: config?.label ?? null,
    lines,
  }
}

export function mapAiUsageLogRow(row: {
  id: string
  provider: string
  model: string
  role: string
  input_tokens: number
  output_tokens: number
  cost_estimate: number
  latency_ms: number
  success: boolean
  error_message: string | null
  created_at: string
}): AiUsageLogWithBreakdown {
  const mapped: AiUsageLogRow = {
    id: row.id,
    provider: row.provider,
    model: row.model,
    role: row.role,
    inputTokens: row.input_tokens ?? 0,
    outputTokens: row.output_tokens ?? 0,
    costEstimate: Number(row.cost_estimate ?? 0),
    latencyMs: row.latency_ms ?? 0,
    success: row.success,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  }

  return {
    ...mapped,
    breakdown: buildAiUsageCostBreakdown(mapped),
  }
}

export function verifyAiUsageLogs(
  logs: AiUsageLogWithBreakdown[],
  days: number,
  dashboardResolver: (provider: string) => string | null
): AiCostVerificationResult {
  const matchedQueries = logs.filter((log) => log.breakdown.matches).length
  const mismatchedQueries = logs.length - matchedQueries
  const totalStoredCost = logs.reduce((sum, log) => sum + log.costEstimate, 0)
  const totalComputedCost = logs.reduce(
    (sum, log) => sum + log.breakdown.computedCost,
    0
  )
  const varianceUsd = Math.abs(totalStoredCost - totalComputedCost)
  const variancePctValue = variancePct(totalStoredCost, totalComputedCost)

  const providerMap = new Map<
    string,
    {
      queryCount: number
      storedCost: number
      computedCost: number
      mismatches: number
    }
  >()

  for (const log of logs) {
    const prev = providerMap.get(log.provider) ?? {
      queryCount: 0,
      storedCost: 0,
      computedCost: 0,
      mismatches: 0,
    }
    providerMap.set(log.provider, {
      queryCount: prev.queryCount + 1,
      storedCost: prev.storedCost + log.costEstimate,
      computedCost: prev.computedCost + log.breakdown.computedCost,
      mismatches: prev.mismatches + (log.breakdown.matches ? 0 : 1),
    })
  }

  const byProvider = Array.from(providerMap.entries())
    .map(([provider, stats]) => ({
      provider,
      queryCount: stats.queryCount,
      storedCost: stats.storedCost,
      computedCost: stats.computedCost,
      varianceUsd: Math.abs(stats.storedCost - stats.computedCost),
      variancePct: variancePct(stats.storedCost, stats.computedCost),
      mismatches: stats.mismatches,
      dashboardUrl: dashboardResolver(provider),
    }))
    .sort((a, b) => b.storedCost - a.storedCost)

  let status: AiCostVerificationResult["status"] = "ok"
  if (mismatchedQueries > 0 || variancePctValue > 25) {
    status = "error"
  } else if (variancePctValue > 10) {
    status = "warn"
  } else {
    status = varianceLevel(variancePctValue)
  }

  const sampleMismatches = logs
    .filter((log) => !log.breakdown.matches)
    .slice(0, 5)

  return {
    days,
    totalQueries: logs.length,
    matchedQueries,
    mismatchedQueries,
    totalStoredCost,
    totalComputedCost,
    varianceUsd,
    variancePct: variancePctValue,
    status,
    byProvider,
    sampleMismatches,
    verifiedAt: new Date().toISOString(),
  }
}
