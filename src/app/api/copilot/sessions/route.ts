import { NextResponse } from "next/server"

import {
  createChatSession,
  deleteChatSession,
  getChatMessages,
  listChatSessions,
  updateSessionTitle,
} from "@/features/copilot/lib/sessions"
import { requireAdmin } from "@/shared/lib/auth"
import { rateLimitRequest } from "@/shared/lib/security/api-route"

export async function GET(request: Request) {
  await requireAdmin()

  const rateLimit = await rateLimitRequest(request, "copilot")
  if (!rateLimit.ok) {
    return rateLimit.response
  }

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("sessionId")

  if (sessionId) {
    const messages = await getChatMessages(sessionId)
    return NextResponse.json({ messages }, { headers: rateLimit.headers })
  }

  const sessions = await listChatSessions()
  return NextResponse.json({ sessions }, { headers: rateLimit.headers })
}

export async function POST(request: Request) {
  await requireAdmin()

  const rateLimit = await rateLimitRequest(request, "copilot")
  if (!rateLimit.ok) {
    return rateLimit.response
  }

  const body = (await request.json()) as { title?: string }
  const session = await createChatSession(body.title)
  return NextResponse.json({ session }, { headers: rateLimit.headers })
}

export async function PATCH(request: Request) {
  await requireAdmin()

  const rateLimit = await rateLimitRequest(request, "copilot")
  if (!rateLimit.ok) {
    return rateLimit.response
  }

  const body = (await request.json()) as { sessionId?: string; title?: string }

  if (!body.sessionId || !body.title?.trim()) {
    return NextResponse.json(
      { error: "sessionId and title are required." },
      { status: 400, headers: rateLimit.headers }
    )
  }

  await updateSessionTitle(body.sessionId, body.title.trim())
  return NextResponse.json({ success: true }, { headers: rateLimit.headers })
}

export async function DELETE(request: Request) {
  await requireAdmin()

  const rateLimit = await rateLimitRequest(request, "copilot")
  if (!rateLimit.ok) {
    return rateLimit.response
  }

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("sessionId")

  if (!sessionId) {
    return NextResponse.json(
      { error: "sessionId is required." },
      { status: 400, headers: rateLimit.headers }
    )
  }

  await deleteChatSession(sessionId)
  return NextResponse.json({ success: true }, { headers: rateLimit.headers })
}
