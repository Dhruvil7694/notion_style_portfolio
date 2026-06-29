import { NextResponse } from "next/server"

import { runAeoScorer } from "@/features/aeo/lib/audit/scorer"
import { runGeoScorer } from "@/features/geo/lib/audit/scorer"
import {
  revalidatePublicContent,
  revalidatePublicProjects,
} from "@/features/portfolio/lib/revalidate-cache"
import { runSeoScorer } from "@/features/seo/lib/audit/scorer"
import type { VisibilityMode } from "@/features/visibility/agents/types"
import { requireAdmin } from "@/shared/lib/auth"
import { createAdminClient } from "@/shared/lib/supabase/admin"

type RequestBody = {
  table: "projects" | "content"
  id: string
  mode: VisibilityMode
  itemType?: string
  update: Record<string, unknown>
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v
  )
}

// All fields each mode is allowed to write — server-side whitelist
const ALLOWED_FIELDS: Record<VisibilityMode, Set<string>> = {
  seo: new Set([
    "seo_title",
    "seo_description",
    "ai_summary",
    "key_takeaways",
    "faq",
    "summary", // projects
    "excerpt", // content (mapped from summary key)
    "tags", // content
  ]),
  aeo: new Set([
    "ai_summary",
    "key_takeaways",
    "faq",
    "concepts",
    "summary", // projects
    "excerpt", // content
    "expertise_slugs",
  ]),
  geo: new Set([
    "ai_summary",
    "key_takeaways",
    "concepts",
    "faq",
    "summary", // projects
    "excerpt", // content
    "tags", // content
    "expertise_slugs",
  ]),
}

export async function POST(request: Request): Promise<NextResponse> {
  await requireAdmin()

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { table, id, mode, itemType, update } = body

  if (table !== "projects" && table !== "content") {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 })
  }
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }
  if (mode !== "seo" && mode !== "aeo" && mode !== "geo") {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 })
  }
  if (!update || typeof update !== "object") {
    return NextResponse.json({ error: "Missing update" }, { status: 400 })
  }

  const allowed = ALLOWED_FIELDS[mode]
  const safeUpdate: Record<string, unknown> = {}

  for (const key of Object.keys(update)) {
    if (!allowed.has(key)) continue
    // "summary" key maps to "excerpt" for content table
    if (key === "summary" && table === "content") {
      safeUpdate["excerpt"] = update[key]
    } else {
      safeUpdate[key] = update[key]
    }
  }

  if (Object.keys(safeUpdate).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { error: writeError } = await supabase
    .from(table)
    .update({ ...safeUpdate, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (writeError) {
    console.error("[visibility/apply]", writeError.message)
    return NextResponse.json({ error: "DB write failed" }, { status: 500 })
  }

  // Re-fetch for accurate rescoring
  const { data: updatedRow } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single()

  const updatedItem = (updatedRow ?? {}) as Record<string, unknown>
  const resolvedType =
    itemType ??
    (table === "projects"
      ? "project"
      : String(updatedItem["type"] ?? updatedItem["item_type"] ?? "blog"))

  let newScore: number | null = null
  let newBand: string | null = null

  try {
    const t = resolvedType as "project" | "blog" | "research" | "automation"
    if (mode === "seo") {
      const s = runSeoScorer(updatedItem, t, table)
      newScore = s.score
      newBand = s.band
    } else if (mode === "aeo") {
      const s = runAeoScorer(updatedItem, t, table)
      newScore = s.score
      newBand = s.band
    } else {
      const s = runGeoScorer(updatedItem, t, table)
      newScore = s.score
      newBand = s.band
    }
  } catch {
    // best-effort
  }

  if (table === "projects") {
    revalidatePublicProjects()
  } else {
    revalidatePublicContent()
  }

  return NextResponse.json({ ok: true, mode, newScore, newBand })
}
