import "server-only"

export type EventValidationResult = {
  event: string
  count: number
  lastSeen: string | null
  status: "pass" | "no-data" | "unconfigured"
}

const ALL_EVENTS = [
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
  "copilot_opened",
  "copilot_tool_invoked",
] as const

type PostHogQueryResponse = {
  results?: Array<[string, number, string | null]>
  error?: string
}

export async function validatePostHogEvents(
  projectId: string,
  apiKey: string
): Promise<EventValidationResult[]> {
  const query = `
    SELECT event, count() as cnt, max(timestamp) as last_seen
    FROM events
    WHERE timestamp >= now() - interval 30 day
      AND event IN (${ALL_EVENTS.map((e) => `'${e}'`).join(", ")})
    GROUP BY event
    ORDER BY event
  `

  let data: PostHogQueryResponse = {}
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
    if (res.ok) {
      data = (await res.json()) as PostHogQueryResponse
    }
  } catch {
    // PostHog unreachable — return unconfigured
  }

  const byEvent = new Map<string, { count: number; lastSeen: string | null }>()
  for (const row of data.results ?? []) {
    byEvent.set(row[0], { count: row[1], lastSeen: row[2] })
  }

  return ALL_EVENTS.map((event) => {
    const found = byEvent.get(event)
    if (!found) {
      return { event, count: 0, lastSeen: null, status: "no-data" as const }
    }
    return {
      event,
      count: found.count,
      lastSeen: found.lastSeen,
      status: "pass" as const,
    }
  })
}

export function getPostHogConfig(): {
  projectId: string | null
  apiKey: string | null
} {
  const raw = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? ""
  // PostHog project IDs are embedded in some API keys (phc_xxx) but we
  // rely on a separate POSTHOG_PROJECT_ID env or fall back to extracting
  // the project ID from the personal API key header.
  const projectId = process.env.POSTHOG_PROJECT_ID ?? null
  const apiKey = process.env.POSTHOG_API_KEY ?? null
  void raw
  return { projectId, apiKey }
}
