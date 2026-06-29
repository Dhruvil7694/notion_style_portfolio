import { NextResponse } from "next/server"

import { runAiCostVerification } from "@/features/admin/lib/ai-usage-queries"
import { requireAdmin } from "@/shared/lib/auth"

export async function POST(request: Request) {
  await requireAdmin()

  let days = 7
  try {
    const body = (await request.json()) as { days?: number }
    if (typeof body.days === "number" && body.days > 0 && body.days <= 90) {
      days = Math.floor(body.days)
    }
  } catch {
    // default days
  }

  const result = await runAiCostVerification(days)
  return NextResponse.json(result)
}
