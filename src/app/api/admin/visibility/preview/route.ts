import { NextResponse } from "next/server"

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
  failingRuleIds?: string[]
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v
  )
}

// Rule → field mapping per mode
// If any rule in a rule-group is failing, the whole field needs regeneration
const SEO_RULE_TO_FIELD: Record<string, string> = {
  seo_title_length: "seo_title",
  seo_title_keyword: "seo_title",
  seo_desc_length: "seo_description",
  seo_desc_keyword: "seo_description",
  summary_length: "summary",
  faq_min_count: "faq",
  faq_answer_quality: "faq",
  ai_summary_depth: "ai_summary",
  tags_or_stack: "tags",
  key_takeaways_count: "key_takeaways",
}

const AEO_RULE_TO_FIELD: Record<string, string> = {
  faq_exists: "faq",
  faq_count: "faq",
  faq_answer_depth: "faq",
  faq_question_quality: "faq",
  ai_summary_exists: "ai_summary",
  ai_summary_depth: "ai_summary",
  ai_summary_answer_style: "ai_summary",
  key_takeaways_exists: "key_takeaways",
  key_takeaways_count: "key_takeaways",
  expertise_linked: "expertise_slugs",
  concept_tags: "concepts",
  excerpt_answer_style: "summary",
}

const GEO_RULE_TO_FIELD: Record<string, string> = {
  entity_summary: "summary",
  expertise_breadth: "expertise_slugs",
  concept_coverage: "concepts",
  has_faq_schema: "faq",
  key_takeaways_density: "key_takeaways",
  quotable_summary: "ai_summary",
  technology_tags: "tags",
}

function getNeededFields(
  mode: VisibilityMode,
  failingRuleIds: string[]
): Set<string> {
  const map =
    mode === "seo"
      ? SEO_RULE_TO_FIELD
      : mode === "aeo"
        ? AEO_RULE_TO_FIELD
        : GEO_RULE_TO_FIELD
  const fields = new Set<string>()
  for (const ruleId of failingRuleIds) {
    const field = map[ruleId]
    if (field) fields.add(field)
  }
  return fields
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
  "seo_title",
  "seo_description",
  "faq",
  "key_takeaways",
  "tech_stack",
  "technologies",
  "expertise_slugs",
  "concepts",
].join(",")

const CONTENT_FETCH_COLUMNS = [
  "id",
  "title",
  "slug",
  "type",
  "excerpt",
  "ai_summary",
  "seo_title",
  "seo_description",
  "faq",
  "key_takeaways",
  "tags",
  "expertise_slugs",
  "concepts",
].join(",")

export async function POST(request: Request): Promise<NextResponse> {
  await requireAdmin()

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { table, id, mode, failingRuleIds = [] } = body

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
    return NextResponse.json(
      { error: `Item not found in ${table} (id: ${id})` },
      { status: 404 }
    )
  }

  // Fetch all available expertise slugs so agents can pick from real options
  const { data: expertiseRows } = await supabase
    .from("expertise")
    .select("slug")
    .order("slug")
  const availableExpertiseSlugs: string[] = (expertiseRows ?? []).map(
    (r: { slug: string }) => r.slug
  )

  const itemRecord = item as unknown as Record<string, unknown>

  // Compute which fields actually need AI generation
  const neededFields = getNeededFields(mode, failingRuleIds)
  // If no failing rules passed, fix everything (fallback for "fix all" mode)
  const fixAll = failingRuleIds.length === 0

  const agentResult = await (mode === "seo"
    ? runSeoAgent(itemRecord, fixAll ? undefined : neededFields)
    : mode === "aeo"
      ? runAeoAgent(
          itemRecord,
          availableExpertiseSlugs,
          fixAll ? undefined : neededFields
        )
      : runGeoAgent(
          itemRecord,
          availableExpertiseSlugs,
          fixAll ? undefined : neededFields
        ))

  if (!agentResult.ok) {
    return NextResponse.json({ error: agentResult.error }, { status: 500 })
  }

  // Build before/after — for passing fields, after = existing value (no change shown)
  let before: Record<string, unknown>
  let after: Record<string, unknown>

  function existingOrAi<T>(field: string, aiValue: T): T {
    if (fixAll || neededFields.has(field)) return aiValue
    // Field not needed — keep existing value unchanged
    return (itemRecord[field] ??
      (field === "summary" ? (itemRecord["excerpt"] ?? "") : "")) as T
  }

  if (agentResult.fix.mode === "seo") {
    const fix = agentResult.fix.fix
    before = {
      seo_title: itemRecord["seo_title"] ?? "",
      seo_description: itemRecord["seo_description"] ?? "",
      ai_summary: itemRecord["ai_summary"] ?? "",
      key_takeaways: itemRecord["key_takeaways"] ?? [],
      faq: itemRecord["faq"] ?? [],
      summary: itemRecord["summary"] ?? itemRecord["excerpt"] ?? "",
      tags: itemRecord["tags"] ?? [],
    }
    after = {
      seo_title: existingOrAi("seo_title", fix.seo_title.slice(0, 60)),
      seo_description: existingOrAi(
        "seo_description",
        fix.seo_description.slice(0, 155)
      ),
      ai_summary: existingOrAi("ai_summary", fix.ai_summary),
      key_takeaways: existingOrAi("key_takeaways", fix.key_takeaways),
      faq: existingOrAi("faq", fix.faq),
      summary: existingOrAi("summary", fix.summary),
      tags: existingOrAi("tags", fix.tags),
    }
  } else if (agentResult.fix.mode === "aeo") {
    const fix = agentResult.fix.fix
    before = {
      ai_summary: itemRecord["ai_summary"] ?? "",
      key_takeaways: itemRecord["key_takeaways"] ?? [],
      faq: itemRecord["faq"] ?? [],
      concepts: itemRecord["concepts"] ?? [],
      summary: itemRecord["summary"] ?? itemRecord["excerpt"] ?? "",
      expertise_slugs: itemRecord["expertise_slugs"] ?? [],
    }
    after = {
      ai_summary: existingOrAi("ai_summary", fix.ai_summary),
      key_takeaways: existingOrAi("key_takeaways", fix.key_takeaways),
      faq: existingOrAi("faq", fix.faq),
      concepts: existingOrAi("concepts", fix.concepts),
      summary: existingOrAi("summary", fix.summary),
      expertise_slugs: existingOrAi("expertise_slugs", fix.expertise_slugs),
    }
  } else {
    const fix = agentResult.fix.fix
    before = {
      ai_summary: itemRecord["ai_summary"] ?? "",
      key_takeaways: itemRecord["key_takeaways"] ?? [],
      concepts: itemRecord["concepts"] ?? [],
      faq: itemRecord["faq"] ?? [],
      summary: itemRecord["summary"] ?? itemRecord["excerpt"] ?? "",
      tags: itemRecord["tags"] ?? [],
      expertise_slugs: itemRecord["expertise_slugs"] ?? [],
    }
    after = {
      ai_summary: existingOrAi("ai_summary", fix.ai_summary),
      key_takeaways: existingOrAi("key_takeaways", fix.key_takeaways),
      concepts: existingOrAi("concepts", fix.concepts),
      faq: existingOrAi("faq", fix.faq),
      summary: existingOrAi("summary", fix.summary),
      tags: existingOrAi("tags", fix.tags),
      expertise_slugs: existingOrAi("expertise_slugs", fix.expertise_slugs),
    }
  }

  return NextResponse.json({
    ok: true,
    mode,
    before,
    after,
    reasoning: agentResult.fix.fix.reasoning,
    neededFields: fixAll ? null : Array.from(neededFields),
  })
}
