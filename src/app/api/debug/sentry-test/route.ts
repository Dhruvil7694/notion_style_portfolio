import * as Sentry from "@sentry/nextjs"
import { type NextRequest, NextResponse } from "next/server"

import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

type TestType =
  | "public-page-error"
  | "route-handler-error"
  | "assistant-error"
  | "copilot-error"
  | "server-action-error"

function makeRequestId(): string {
  return crypto.randomUUID().slice(0, 8).toUpperCase()
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // admin-only gate
  const supabase = await createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await req.json()) as { type: TestType }
  const { type } = body
  const requestId = makeRequestId()

  if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
    return NextResponse.json({
      eventId: null,
      skipped: true,
      reason: "SENTRY_DSN not configured",
    })
  }

  let eventId: string | undefined

  try {
    switch (type) {
      case "public-page-error": {
        const err = new Error(
          `[Sentry Test] Public page error — req:${requestId}`
        )
        err.stack = `Error: [Sentry Test] Public page error\n    at PublicPageComponent (src/app/(public)/page.tsx:42:10)\n    at renderWithHooks\n    at req:${requestId}`
        eventId = Sentry.captureException(err, {
          tags: { test: "true", route: "/(public)", requestId },
          extra: { environment: process.env.NODE_ENV, requestId },
        })
        break
      }

      case "route-handler-error": {
        const err = new Error(
          `[Sentry Test] Route handler error — req:${requestId}`
        )
        err.stack = `Error: [Sentry Test] Route handler error\n    at GET (src/app/api/chat/route.ts:28:5)\n    at req:${requestId}`
        eventId = Sentry.captureException(err, {
          tags: { test: "true", route: "/api/chat", requestId },
          extra: { environment: process.env.NODE_ENV, requestId },
        })
        break
      }

      case "assistant-error": {
        const err = new Error(
          `[Sentry Test] Assistant stream error — req:${requestId}`
        )
        err.stack = `Error: [Sentry Test] Assistant stream error\n    at streamText (src/lib/ai/stream.ts:55:11)\n    at req:${requestId}`
        eventId = Sentry.captureException(err, {
          tags: {
            test: "true",
            route: "/api/chat",
            component: "assistant",
            requestId,
          },
          extra: {
            provider: "anthropic",
            environment: process.env.NODE_ENV,
            requestId,
          },
        })
        break
      }

      case "copilot-error": {
        const err = new Error(
          `[Sentry Test] Copilot agent error — req:${requestId}`
        )
        err.stack = `Error: [Sentry Test] Copilot agent error\n    at runCopilotAgent (src/lib/copilot/agent.ts:87:9)\n    at req:${requestId}`
        eventId = Sentry.captureException(err, {
          tags: {
            test: "true",
            route: "/api/copilot/chat",
            component: "copilot",
            requestId,
          },
          extra: { environment: process.env.NODE_ENV, requestId },
        })
        break
      }

      case "server-action-error": {
        const err = new Error(
          `[Sentry Test] Server action error — req:${requestId}`
        )
        err.stack = `Error: [Sentry Test] Server action error\n    at updateProject (src/lib/admin/actions.ts:112:7)\n    at req:${requestId}`
        eventId = Sentry.captureException(err, {
          tags: { test: "true", route: "server-action", requestId },
          extra: { environment: process.env.NODE_ENV, requestId },
        })
        break
      }

      default:
        return NextResponse.json(
          { error: "Unknown test type" },
          { status: 400 }
        )
    }

    await Sentry.flush(3000)

    return NextResponse.json({ eventId: eventId ?? null, requestId, type })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
