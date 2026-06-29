import { NextResponse } from "next/server"

import { runAeoScorer } from "@/features/aeo/lib/audit/scorer"
import { runGeoScorer } from "@/features/geo/lib/audit/scorer"
import {
  revalidatePublicContent,
  revalidatePublicProjects,
} from "@/features/portfolio/lib/revalidate-cache"
import { runSeoScorer } from "@/features/seo/lib/audit/scorer"
import { runAeoAgent } from "@/features/visibility/agents/aeo-agent"
import { runGeoAgent } from "@/features/visibility/agents/geo-agent"
import { runSeoAgent } from "@/features/visibility/agents/seo-agent"
import type { VisibilityMode } from "@/features/visibility/agents/types"
import { requireAdmin } from "@/shared/lib/auth"
import { createAdminClient } from "@/shared/lib/supabase/admin"

type RequestBody = {
  table: "projects" | "content"
  id: string
  mode: VisibilityMode
  itemType?: string
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v
  )
}

const PROJECT_FETCH_COLUMNS = [
  "id",
  "title",
  "slug",
  "item_type",
  "summary",
  "tagline",
  "ai_summary",
  "overview",
  "problem",
  "why_built",
  "approach",
  "results",
  "learnings",
  "architecture",
  "ai_design",
  "seo_title",
  "seo_description",
  "faq",
  "key_takeaways",
  "tech_stack",
  "technologies",
  "expertise_slugs",
  "concepts",
  "metrics",
  "project_facts",
  "updated_at",
].join(",")

const CONTENT_FETCH_COLUMNS = [
  "id",
  "title",
  "slug",
  "item_type",
  "excerpt",
  "ai_summary",
  "seo_title",
  "seo_description",
  "faq",
  "key_takeaways",
  "tags",
  "expertise_slugs",
  "concepts",
  "updated_at",
].join(",")

export async function POST(request: Request): Promise<NextResponse> {
  await requireAdmin()

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { table, id, mode, itemType } = body

  if (table !== "projects" && table !== "content") {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 })
  }
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }
  if (mode !== "seo" && mode !== "aeo" && mode !== "geo") {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const columns =
    table === "projects" ? PROJECT_FETCH_COLUMNS : CONTENT_FETCH_COLUMNS

  const { data: item, error: fetchError } = await supabase
    .from(table)
    .select(columns)
    .eq("id", id)
    .single()

  if (fetchError || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 })
  }

  const itemRecord = item as unknown as Record<string, unknown>
  const agentResult = await (mode === "seo"
    ? runSeoAgent(itemRecord)
    : mode === "aeo"
      ? runAeoAgent(itemRecord)
      : runGeoAgent(itemRecord))

  if (!agentResult.ok) {
    return NextResponse.json({ error: agentResult.error }, { status: 500 })
  }

  let update: Record<string, unknown>

  if (agentResult.fix.mode === "seo") {
    update = {
      seo_title: agentResult.fix.fix.seo_title.slice(0, 70),
      seo_description: agentResult.fix.fix.seo_description.slice(0, 160),
    }
  } else if (agentResult.fix.mode === "aeo") {
    update = {
      ai_summary: agentResult.fix.fix.ai_summary,
      key_takeaways: agentResult.fix.fix.key_takeaways,
      faq: agentResult.fix.fix.faq,
    }
  } else {
    update = {
      ai_summary: agentResult.fix.fix.ai_summary,
      key_takeaways: agentResult.fix.fix.key_takeaways,
      concepts: agentResult.fix.fix.concepts,
    }
  }

  const { error: writeError } = await supabase
    .from(table)
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (writeError) {
    console.error("[visibility/fix]", writeError.message)
    return NextResponse.json({ error: "DB write failed" }, { status: 500 })
  }

  // Re-score with merged item so caller gets updated score without reload
  const updatedItem = { ...itemRecord, ...update }
  const resolvedType =
    itemType ??
    (table === "projects"
      ? "project"
      : String(itemRecord["item_type"] ?? "blog"))

  let newScore: number | null = null
  let newBand: string | null = null

  try {
    if (mode === "seo") {
      const scored = runSeoScorer(
        updatedItem,
        resolvedType as "project" | "blog" | "research" | "automation",
        table
      )
      newScore = scored.score
      newBand = scored.band
    } else if (mode === "aeo") {
      const scored = runAeoScorer(
        updatedItem,
        resolvedType as "project" | "blog" | "research" | "automation",
        table
      )
      newScore = scored.score
      newBand = scored.band
    } else {
      const scored = runGeoScorer(
        updatedItem,
        resolvedType as "project" | "blog" | "research" | "automation",
        table
      )
      newScore = scored.score
      newBand = scored.band
    }
  } catch {
    // scoring is best-effort — don't fail the whole request
  }

  if (table === "projects") {
    revalidatePublicProjects()
  } else {
    revalidatePublicContent()
  }

  return NextResponse.json({
    ok: true,
    mode,
    applied: update,
    newScore,
    newBand,
    reasoning:
      agentResult.fix.mode === "seo"
        ? agentResult.fix.fix.reasoning
        : agentResult.fix.mode === "aeo"
          ? agentResult.fix.fix.reasoning
          : agentResult.fix.fix.reasoning,
  })
}
