import { NextResponse } from "next/server"

import { requireAdmin } from "@/lib/auth"
import type { CopilotToolName } from "@/lib/copilot/tools"
import { COPILOT_TOOLS,executeCopilotTool } from "@/lib/copilot/tools"
import { rateLimitRequest } from "@/lib/security/api-route"

export async function GET(request: Request) {
  await requireAdmin()

  const rateLimit = await rateLimitRequest(request, "copilot")
  if (!rateLimit.ok) {
    return rateLimit.response
  }

  return NextResponse.json({ tools: COPILOT_TOOLS }, { headers: rateLimit.headers })
}

export async function POST(request: Request) {
  await requireAdmin()

  const rateLimit = await rateLimitRequest(request, "copilot")
  if (!rateLimit.ok) {
    return rateLimit.response
  }

  const body = (await request.json()) as {
    tool: CopilotToolName
    args?: Record<string, unknown>
    confirmed?: boolean
  }

  if (!body.tool) {
    return NextResponse.json(
      { error: "Tool name is required." },
      { status: 400, headers: rateLimit.headers }
    )
  }

  const result = await executeCopilotTool(body.tool, body.args ?? {}, {
    confirmed: body.confirmed ?? false,
  })

  return NextResponse.json(result, { headers: rateLimit.headers })
}
