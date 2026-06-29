import "server-only"

export type EventValidationResult = {
  event: string
  count: number
  lastSeen: string | null
  status: "pass" | "no-data" | "unconfigured"
}

export type PostHogInsights = {
  pageviews30d: number
  uniqueVisitors30d: number
  sessions30d: number
  pageviews7d: number
  uniqueVisitors7d: number
  topPages: { path: string; count: number }[]
  topEvents: { event: string; count: number }[]
  eventCoverage: { passed: number; noData: number; total: number }
  eventResults: EventValidationResult[]
  newUsers7d: number
  returningUsers7d: number
  capturedAt: string
}

const TRACKED_EVENTS = [
  "project_view",
  "research_view",
  "article_view",
  "automation_view",
  "expertise_view",
  "technology_view",
  "faq_expand",
  "contact_click",
  "resume_download",
  "search_opened",
  "search_query",
  "search_result_click",
  "assistant_opened",
  "assistant_question",
  "assistant_source_click",
  "assistant_job_fit_mode",
  "assistant_job_fit",
  "jd_classification_feedback",
  "copilot_opened",
  "copilot_tool_invoked",
] as const

type HogQLResponse = {
  results?: Array<unknown[]>
  error?: string
}

async function hogql(
  projectId: string,
  apiKey: string,
  query: string
): Promise<HogQLResponse> {
  try {
    const res = await fetch(
      `https://us.posthog.com/api/projects/${projectId}/query/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
        next: { revalidate: 0 },
      }
    )
    if (res.ok) return (await res.json()) as HogQLResponse
  } catch {
    // network error
  }
  return {}
}

export async function getPostHogInsights(
  projectId: string,
  apiKey: string
): Promise<PostHogInsights> {
  const [
    overviewData,
    overview7dData,
    topPagesData,
    topEventsData,
    trackedEventsData,
    returningData,
  ] = await Promise.all([
    // 30-day overview: pageviews, unique visitors, sessions
    hogql(
      projectId,
      apiKey,
      `
      SELECT
        countIf(event = '$pageview') as pageviews,
        uniq(distinct_id) as unique_visitors,
        uniq(session_id) as sessions
      FROM events
      WHERE timestamp >= now() - interval 30 day
      `
    ),
    // 7-day overview
    hogql(
      projectId,
      apiKey,
      `
      SELECT
        countIf(event = '$pageview') as pageviews,
        uniq(distinct_id) as unique_visitors
      FROM events
      WHERE timestamp >= now() - interval 7 day
      `
    ),
    // Top pages by pageviews (30d)
    hogql(
      projectId,
      apiKey,
      `
      SELECT
        properties.$pathname as path,
        count() as cnt
      FROM events
      WHERE event = '$pageview'
        AND timestamp >= now() - interval 30 day
        AND properties.$pathname IS NOT NULL
      GROUP BY path
      ORDER BY cnt DESC
      LIMIT 8
      `
    ),
    // Top custom events by volume (30d)
    hogql(
      projectId,
      apiKey,
      `
      SELECT event, count() as cnt
      FROM events
      WHERE timestamp >= now() - interval 30 day
        AND event NOT LIKE '$%'
      GROUP BY event
      ORDER BY cnt DESC
      LIMIT 10
      `
    ),
    // Tracked events validation (30d)
    hogql(
      projectId,
      apiKey,
      `
      SELECT event, count() as cnt, max(timestamp) as last_seen
      FROM events
      WHERE timestamp >= now() - interval 30 day
        AND event IN (${TRACKED_EVENTS.map((e) => `'${e}'`).join(", ")})
      GROUP BY event
      ORDER BY event
      `
    ),
    // New vs returning (7d) — new = first seen in last 7d
    hogql(
      projectId,
      apiKey,
      `
      SELECT
        countIf(min_ts >= now() - interval 7 day) as new_users,
        countIf(min_ts < now() - interval 7 day) as returning_users
      FROM (
        SELECT distinct_id, min(timestamp) as min_ts
        FROM events
        WHERE timestamp >= now() - interval 7 day
        GROUP BY distinct_id
      )
      `
    ),
  ])

  // Parse 30d overview
  const overviewRow = (overviewData.results?.[0] ?? []) as [
    number,
    number,
    number,
  ]
  const pageviews30d = Number(overviewRow[0] ?? 0)
  const uniqueVisitors30d = Number(overviewRow[1] ?? 0)
  const sessions30d = Number(overviewRow[2] ?? 0)

  // Parse 7d overview
  const overview7dRow = (overview7dData.results?.[0] ?? []) as [number, number]
  const pageviews7d = Number(overview7dRow[0] ?? 0)
  const uniqueVisitors7d = Number(overview7dRow[1] ?? 0)

  // Parse top pages
  const topPages = (topPagesData.results ?? []).map((row) => ({
    path: String((row as [string, number])[0] ?? ""),
    count: Number((row as [string, number])[1] ?? 0),
  }))

  // Parse top events
  const topEvents = (topEventsData.results ?? []).map((row) => ({
    event: String((row as [string, number])[0] ?? ""),
    count: Number((row as [string, number])[1] ?? 0),
  }))

  // Parse tracked events
  const byEvent = new Map<string, { count: number; lastSeen: string | null }>()
  for (const row of trackedEventsData.results ?? []) {
    const r = row as [string, number, string | null]
    byEvent.set(r[0], { count: r[1], lastSeen: r[2] })
  }
  const eventResults: EventValidationResult[] = TRACKED_EVENTS.map((event) => {
    const found = byEvent.get(event)
    if (!found)
      return { event, count: 0, lastSeen: null, status: "no-data" as const }
    return {
      event,
      count: found.count,
      lastSeen: found.lastSeen,
      status: "pass" as const,
    }
  })
  const passed = eventResults.filter((r) => r.status === "pass").length
  const noData = eventResults.filter((r) => r.status === "no-data").length

  // Parse new vs returning
  const retRow = (returningData.results?.[0] ?? []) as [number, number]
  const newUsers7d = Number(retRow[0] ?? 0)
  const returningUsers7d = Number(retRow[1] ?? 0)

  return {
    pageviews30d,
    uniqueVisitors30d,
    sessions30d,
    pageviews7d,
    uniqueVisitors7d,
    topPages,
    topEvents,
    eventCoverage: { passed, noData, total: TRACKED_EVENTS.length },
    eventResults,
    newUsers7d,
    returningUsers7d,
    capturedAt: new Date().toISOString(),
  }
}

export function getPostHogConfig(): {
  projectId: string | null
  apiKey: string | null
} {
  const projectId = process.env.POSTHOG_PROJECT_ID ?? null
  const apiKey = process.env.POSTHOG_API_KEY ?? null
  return { projectId, apiKey }
}

// Keep for backward compat
export type { EventValidationResult as EventResult }
export async function validatePostHogEvents(
  projectId: string,
  apiKey: string
): Promise<EventValidationResult[]> {
  const insights = await getPostHogInsights(projectId, apiKey)
  return insights.eventResults
}
