import { NextResponse } from "next/server"
import { z } from "zod"

import { persistProviderApiKey } from "@/features/admin/lib/actions/ai-settings"
import { validateProviderApiKey } from "@/features/ai/lib/providers/validate-provider-key"
import { aiProviderIdSchema } from "@/features/ai/lib/settings"
import { requireAdmin } from "@/shared/lib/auth"

const bodySchema = z.object({
  provider: aiProviderIdSchema,
  apiKey: z.string().trim().optional(),
})

export async function POST(request: Request) {
  await requireAdmin()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 }
    )
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid request",
      },
      { status: 400 }
    )
  }

  const { provider } = parsed.data
  const typedKey = parsed.data.apiKey?.trim()
  const shouldPersist = Boolean(typedKey)

  const { resolveProviderKey } = await import("@/features/ai/lib/provider-keys")
  let apiKey = typedKey

  if (!apiKey) {
    apiKey = await resolveProviderKey(provider)
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "No API key configured for this provider" },
        { status: 400 }
      )
    }
  }

  const result = await validateProviderApiKey(provider, apiKey)
  if (!result.ok) {
    return NextResponse.json(result)
  }

  if (!shouldPersist) {
    return NextResponse.json({
      ...result,
      saved: false,
    })
  }

  const saved = await persistProviderApiKey(provider, typedKey!)
  if (!saved.success) {
    return NextResponse.json(
      { ok: false, error: saved.error ?? "Failed to save API key" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    saved: true,
    maskedKey: saved.data?.maskedKey ?? result.maskedKey,
    latencyMs: result.latencyMs,
  })
}
