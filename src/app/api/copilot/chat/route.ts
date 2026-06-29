import { NextResponse } from "next/server"

import { isAiConfigured } from "@/features/ai/lib"
import {
  getCachedKnowledgeSummary,
  getCachedPortfolioSnapshot,
  getCachedToolSummary,
} from "@/features/ai/lib/cache/summaries"
import {
  type CopilotAgentMessage,
  runCopilotAgent,
} from "@/features/copilot/lib/agent"
import { getApplyTool, getProposeTool } from "@/features/copilot/lib/registry"
import type { PendingActionPayload } from "@/features/copilot/lib/registry/types"
import {
  createChatSession,
  getChatMessages,
  getChatSession,
  saveChatMessage,
} from "@/features/copilot/lib/sessions"
import { getPublicSettings } from "@/features/portfolio/lib/queries"
import { resolveSiteUrl } from "@/features/seo/lib/canonical"
import { requireAdmin } from "@/shared/lib/auth"
import { rateLimitRequest } from "@/shared/lib/security/api-route"

export const maxDuration = 120

type ConfirmBody = {
  action: "confirm"
  sessionId: string
  pendingActionId: string
  applyTool: string
  applyArgs: Record<string, unknown>
}

type CancelBody = {
  action: "cancel"
  sessionId: string
  pendingActionId: string
}

type RegenerateBody = {
  action: "regenerate"
  sessionId: string
  pendingActionId: string
  proposeTool: string
  proposeArgs: Record<string, unknown>
}

type MessageBody = {
  message: string
  sessionId?: string
  action?: never
}

type ChatBody = MessageBody | ConfirmBody | CancelBody | RegenerateBody

type StreamMeta = {
  sessionId: string
  pendingActions?: Array<PendingActionPayload & { id: string }>
  toolNames?: string[]
  redirectUrl?: string
  redirectLabel?: string
  finalText?: string
  error?: string
}

function streamResponse(
  text: string,
  meta: StreamMeta,
  headers: HeadersInit
): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const chunks = text.match(/.{1,40}/g) ?? [text]
      let index = 0

      function pushNext() {
        if (index >= chunks.length) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", ...meta })}\n\n`
            )
          )
          controller.close()
          return
        }
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "text", text: chunks[index] })}\n\n`
          )
        )
        index += 1
        setTimeout(pushNext, 8)
      }

      pushNext()
    },
  })

  return new Response(stream, {
    headers: {
      ...headers,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Copilot-Session-Id": meta.sessionId,
    },
  })
}

async function fetchContextText(): Promise<string> {
  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)
  if (!siteUrl) return ""
  const [snapshot, knowledge, toolSummary] = await Promise.all([
    getCachedPortfolioSnapshot(siteUrl),
    getCachedKnowledgeSummary(siteUrl),
    getCachedToolSummary(),
  ])
  return [snapshot, knowledge, toolSummary].filter(Boolean).join("\n\n")
}

async function clearPendingOnPriorMessage(
  sessionId: string,
  pendingActionId: string
) {
  const history = await getChatMessages(sessionId)
  const target = [...history].reverse().find((msg) => {
    if (msg.role !== "assistant") return false
    const pending = (msg.metadata?.pendingActions ?? []) as Array<{
      id: string
    }>
    return pending.some((p) => p.id === pendingActionId)
  })
  if (!target) return

  const { getAdminMutationClient } =
    await import("@/features/admin/lib/actions/client")
  const { asCopilotClient } = await import("@/features/copilot/lib/db-client")
  const supabase = asCopilotClient(await getAdminMutationClient())
  const remaining = (
    (target.metadata?.pendingActions ?? []) as Array<{ id: string }>
  ).filter((p) => p.id !== pendingActionId)
  await supabase
    .from("chat_messages")
    .update({
      metadata: {
        ...(target.metadata ?? {}),
        pendingActions: remaining,
        resolvedActionIds: [
          ...((target.metadata?.resolvedActionIds ?? []) as string[]),
          pendingActionId,
        ],
      },
    })
    .eq("id", target.id)
}

export async function POST(request: Request) {
  await requireAdmin()

  const rateLimit = await rateLimitRequest(request, "copilot")
  if (!rateLimit.ok) return rateLimit.response

  if (!(await isAiConfigured())) {
    return NextResponse.json(
      { error: "CMS Copilot is not configured. Set an AI provider API key." },
      { status: 503, headers: rateLimit.headers }
    )
  }

  const body = (await request.json()) as ChatBody

  // ===== Cancel =====
  if ("action" in body && body.action === "cancel") {
    const { sessionId, pendingActionId } = body
    if (!sessionId || !pendingActionId) {
      return NextResponse.json(
        { error: "sessionId and pendingActionId are required." },
        { status: 400, headers: rateLimit.headers }
      )
    }
    const session = await getChatSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404, headers: rateLimit.headers }
      )
    }
    const text =
      "No worries — skipped that one. Nothing changed on the live site."
    await saveChatMessage(sessionId, "assistant", text, {
      action: "cancel",
      pendingActionId,
    })
    await clearPendingOnPriorMessage(sessionId, pendingActionId)
    return streamResponse(text, { sessionId }, rateLimit.headers)
  }

  // ===== Confirm =====
  if ("action" in body && body.action === "confirm") {
    const { sessionId, pendingActionId, applyTool, applyArgs } = body
    if (!sessionId || !pendingActionId || !applyTool) {
      return NextResponse.json(
        { error: "sessionId, pendingActionId, applyTool required." },
        { status: 400, headers: rateLimit.headers }
      )
    }
    const session = await getChatSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404, headers: rateLimit.headers }
      )
    }

    const apply = getApplyTool(applyTool)
    if (!apply) {
      const text = `Unknown apply tool: ${applyTool}. Nothing changed.`
      await saveChatMessage(sessionId, "assistant", text, {
        action: "confirm-result",
        pendingActionId,
        applyTool,
        success: false,
      })
      await clearPendingOnPriorMessage(sessionId, pendingActionId)
      return streamResponse(text, { sessionId, error: text }, rateLimit.headers)
    }

    await saveChatMessage(sessionId, "user", `[confirmed: ${applyTool}]`, {
      action: "confirm",
      pendingActionId,
      applyTool,
    })

    const result = await apply.execute(applyArgs ?? {})

    let text: string
    let redirectUrl: string | undefined
    let redirectLabel: string | undefined
    let finalText: string | undefined

    if (!result.success) {
      text = `Something blocked the save: ${result.error ?? "unknown error"}. Nothing changed on the live site.`
    } else {
      text = result.data?.message ?? "Done — your change is live."
      redirectUrl = result.data?.redirectUrl
      redirectLabel = result.data?.redirectLabel
      finalText = result.data?.finalText
    }

    await saveChatMessage(sessionId, "assistant", text, {
      action: "confirm-result",
      pendingActionId,
      applyTool,
      success: result.success,
      error: result.error,
      data: result.data,
      redirectUrl,
      redirectLabel,
      finalText,
    })
    await clearPendingOnPriorMessage(sessionId, pendingActionId)

    return streamResponse(
      text,
      { sessionId, redirectUrl, redirectLabel, finalText },
      rateLimit.headers
    )
  }

  // ===== Regenerate =====
  if ("action" in body && body.action === "regenerate") {
    const { sessionId, pendingActionId, proposeTool, proposeArgs } = body
    if (!sessionId || !proposeTool) {
      return NextResponse.json(
        { error: "sessionId and proposeTool required." },
        { status: 400, headers: rateLimit.headers }
      )
    }
    const session = await getChatSession(sessionId)
    if (!session) {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404, headers: rateLimit.headers }
      )
    }
    const propose = getProposeTool(proposeTool)
    if (!propose) {
      return NextResponse.json(
        { error: `Unknown propose tool: ${proposeTool}` },
        { status: 400, headers: rateLimit.headers }
      )
    }

    await clearPendingOnPriorMessage(sessionId, pendingActionId)

    const result = await propose.build(proposeArgs ?? {})
    if (!result.ok) {
      const text = `Couldn't regenerate: ${result.error}`
      await saveChatMessage(sessionId, "assistant", text, {
        action: "regenerate-fail",
        pendingActionId,
        proposeTool,
      })
      return streamResponse(
        text,
        { sessionId, error: result.error },
        rateLimit.headers
      )
    }

    const enriched = { ...result.pending, id: crypto.randomUUID() }
    const variantCount = enriched.variants?.length ?? 0
    const text =
      variantCount > 1
        ? `Fresh batch — ${variantCount} new takes ready. Pick one or regenerate again.`
        : "Regenerated. Review the proposal below."

    await saveChatMessage(sessionId, "assistant", text, {
      action: "regenerate-result",
      pendingActionId,
      proposeTool,
      pendingActions: [enriched],
    })

    return streamResponse(
      text,
      { sessionId, pendingActions: [enriched] },
      rateLimit.headers
    )
  }

  // ===== Message =====
  const message = body.message?.trim()
  if (!message) {
    return NextResponse.json(
      { error: "Message is required." },
      { status: 400, headers: rateLimit.headers }
    )
  }

  let sessionId = body.sessionId
  if (!sessionId) {
    const session = await createChatSession(message.slice(0, 60))
    sessionId = session.id
  } else {
    const existing = await getChatSession(sessionId)
    if (!existing) {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404, headers: rateLimit.headers }
      )
    }
  }

  await saveChatMessage(sessionId, "user", message)

  const history = await getChatMessages(sessionId)
  const priorMessages: CopilotAgentMessage[] = history
    .slice(0, -1)
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))

  let contextText = ""
  try {
    contextText = await fetchContextText()
  } catch (err) {
    console.error("[copilot-chat] context fetch failed:", err)
  }

  let result
  try {
    result = await runCopilotAgent(message, priorMessages, contextText)
  } catch (error) {
    const text =
      error instanceof Error
        ? `Couldn't reach the AI provider: ${error.message}`
        : "Couldn't reach the AI provider."
    await saveChatMessage(sessionId, "assistant", text, { error: true })
    return streamResponse(text, { sessionId, error: text }, rateLimit.headers)
  }

  const enrichedPending = result.pendingActions.map((p) => ({
    ...p,
    id: crypto.randomUUID(),
  }))

  await saveChatMessage(sessionId, "assistant", result.response, {
    toolNames: result.toolNames,
    pendingActions: enrichedPending,
  })

  return streamResponse(
    result.response,
    {
      sessionId,
      pendingActions: enrichedPending,
      toolNames: result.toolNames,
    },
    rateLimit.headers
  )
}
