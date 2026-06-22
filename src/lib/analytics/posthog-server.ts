import "server-only"

import { PostHog } from "posthog-node"

let client: PostHog | null = null

function getClient(): PostHog | null {
  const key = process.env.POSTHOG_API_KEY
  if (!key) return null

  if (!client) {
    const host =
      process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com"
    client = new PostHog(key, { host })
  }

  return client
}

export async function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const ph = getClient()
  if (!ph) return

  ph.capture({ distinctId, event, properties })
  await ph.flush()
}
