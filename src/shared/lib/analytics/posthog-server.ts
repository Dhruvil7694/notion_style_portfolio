import "server-only"

import { PostHog } from "posthog-node"

let client: PostHog | null = null

function getClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key) return null

  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
  if (!host) return null

  if (!client) {
    client = new PostHog(key, { host, flushAt: 1, flushInterval: 0 })
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
