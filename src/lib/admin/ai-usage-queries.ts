import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"

function getSupabase() {
  return createAdminClient()
}

function sinceIso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString()
}

export type AiUsageSummary = {
  totalRequests: number
  successRate: number
  totalInputTokens: number
  totalOutputTokens: number
  estimatedCost: number
  avgLatencyMs: number
  failoverCount: number
  byProvider: {
    provider: string
    count: number
    cost: number
    avgLatency: number
  }[]
  byModel: { model: string; count: number }[]
  byRole: { role: string; count: number }[]
}

export async function getAiUsageSummary(
  days: number
): Promise<AiUsageSummary> {
  const supabase = await getSupabase()
  const since = sinceIso(days)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("ai_usage_logs")
    .select(
      "provider,model,role,input_tokens,output_tokens,cost_estimate,latency_ms,success"
    )
    .gte("created_at", since)

  if (error) {
    console.error("[ai-usage-queries] getAiUsageSummary error", error)
    return {
      totalRequests: 0,
      successRate: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      estimatedCost: 0,
      avgLatencyMs: 0,
      failoverCount: 0,
      byProvider: [],
      byModel: [],
      byRole: [],
    }
  }

  const rows: {
    provider: string
    model: string
    role: string
    input_tokens: number
    output_tokens: number
    cost_estimate: number
    latency_ms: number
    success: boolean
  }[] = data ?? []

  const totalRequests = rows.length
  const successCount = rows.filter((r) => r.success).length
  const failoverCount = totalRequests - successCount
  const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 0
  const totalInputTokens = rows.reduce((s, r) => s + (r.input_tokens ?? 0), 0)
  const totalOutputTokens = rows.reduce(
    (s, r) => s + (r.output_tokens ?? 0),
    0
  )
  const estimatedCost = rows.reduce((s, r) => s + (r.cost_estimate ?? 0), 0)
  const avgLatencyMs =
    totalRequests > 0
      ? Math.round(
          rows.reduce((s, r) => s + (r.latency_ms ?? 0), 0) / totalRequests
        )
      : 0

  // Group by provider
  const providerMap = new Map<
    string,
    { count: number; cost: number; latencySum: number }
  >()
  for (const r of rows) {
    const p = r.provider ?? "unknown"
    const prev = providerMap.get(p) ?? { count: 0, cost: 0, latencySum: 0 }
    providerMap.set(p, {
      count: prev.count + 1,
      cost: prev.cost + (r.cost_estimate ?? 0),
      latencySum: prev.latencySum + (r.latency_ms ?? 0),
    })
  }
  const byProvider = Array.from(providerMap.entries()).map(([provider, v]) => ({
    provider,
    count: v.count,
    cost: v.cost,
    avgLatency: Math.round(v.latencySum / v.count),
  }))

  // Group by model
  const modelMap = new Map<string, number>()
  for (const r of rows) {
    const m = r.model ?? "unknown"
    modelMap.set(m, (modelMap.get(m) ?? 0) + 1)
  }
  const byModel = Array.from(modelMap.entries()).map(([model, count]) => ({
    model,
    count,
  }))

  // Group by role
  const roleMap = new Map<string, number>()
  for (const r of rows) {
    const role = r.role ?? "unknown"
    roleMap.set(role, (roleMap.get(role) ?? 0) + 1)
  }
  const byRole = Array.from(roleMap.entries()).map(([role, count]) => ({
    role,
    count,
  }))

  return {
    totalRequests,
    successRate,
    totalInputTokens,
    totalOutputTokens,
    estimatedCost,
    avgLatencyMs,
    failoverCount,
    byProvider,
    byModel,
    byRole,
  }
}

export type AiUsageTimeSeriesEntry = {
  date: string
  requests: number
  cost: number
  tokens: number
}

export async function getAiUsageTimeSeries(
  days: number
): Promise<AiUsageTimeSeriesEntry[]> {
  const supabase = await getSupabase()
  const since = sinceIso(days)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("ai_usage_logs")
    .select("created_at,cost_estimate,input_tokens,output_tokens")
    .gte("created_at", since)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[ai-usage-queries] getAiUsageTimeSeries error", error)
    return []
  }

  const rows: {
    created_at: string
    cost_estimate: number
    input_tokens: number
    output_tokens: number
  }[] = data ?? []

  const dateMap = new Map<
    string,
    { requests: number; cost: number; tokens: number }
  >()
  for (const r of rows) {
    const date = r.created_at.slice(0, 10) // YYYY-MM-DD
    const prev = dateMap.get(date) ?? { requests: 0, cost: 0, tokens: 0 }
    dateMap.set(date, {
      requests: prev.requests + 1,
      cost: prev.cost + (r.cost_estimate ?? 0),
      tokens:
        prev.tokens + (r.input_tokens ?? 0) + (r.output_tokens ?? 0),
    })
  }

  return Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }))
}

export type AiRecentError = {
  provider: string
  model: string
  error_message: string
  created_at: string
}

export async function getAiRecentErrors(
  limit = 10
): Promise<AiRecentError[]> {
  const supabase = await getSupabase()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("ai_usage_logs")
    .select("provider,model,error_message,created_at")
    .eq("success", false)
    .not("error_message", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[ai-usage-queries] getAiRecentErrors error", error)
    return []
  }

  return (data ?? []) as AiRecentError[]
}
