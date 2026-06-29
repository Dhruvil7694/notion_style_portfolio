import { normalizeSkillKey } from "@/features/portfolio/lib/skills-showcase"
import type { Skill } from "@/shared/types/database.helpers"

type SupabaseMutationClient = Awaited<
  ReturnType<
    typeof import("@/features/admin/lib/actions/client").getAdminMutationClient
  >
>

export function inferSkillCategory(techName: string): Skill["category"] {
  const key = normalizeSkillKey(techName)

  if (
    /\b(python|typescript|javascript|java|golang|rust|c\+\+|c#|ruby|php|sql)\b/.test(
      key
    )
  ) {
    return "language"
  }

  if (
    /\b(react|next\.?js|nextjs|fastapi|flask|django|vue|angular|svelte|nestjs|express)\b/.test(
      key
    )
  ) {
    return "framework"
  }

  if (
    /\b(openai|langchain|langgraph|rag|llm|tensorflow|pytorch|hugging|transformers|mlflow|faiss|qdrant|gemini|nlp|lora|qlora|sagemaker|genai|prompt|multi-agent)\b/.test(
      key
    )
  ) {
    return "ai_ml"
  }

  if (
    /\b(aws|azure|gcp|supabase|vercel|netlify|cloudflare|kubernetes|docker|postgres|postgresql|mysql|redis|mongo|nginx)\b/.test(
      key
    )
  ) {
    return "cloud"
  }

  return "tool"
}

export async function syncSkillsFromTechStack(
  supabase: SupabaseMutationClient,
  techStack: string[]
): Promise<number> {
  const normalizedStack = techStack.map((item) => item.trim()).filter(Boolean)

  if (normalizedStack.length === 0) {
    return 0
  }

  const { data: existingSkills, error: fetchError } = await supabase
    .from("skills")
    .select("name")

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  const existingKeys = new Set(
    (existingSkills ?? []).map((skill) => normalizeSkillKey(skill.name))
  )

  const { count, error: countError } = await supabase
    .from("skills")
    .select("id", { count: "exact", head: true })

  if (countError) {
    throw new Error(countError.message)
  }

  let displayOrder = count ?? 0
  const inserts: Array<{
    name: string
    category: Skill["category"]
    proficiency: null
    display_order: number
    show_on_landing: boolean
  }> = []

  for (const tech of normalizedStack) {
    const key = normalizeSkillKey(tech)
    if (existingKeys.has(key)) continue

    existingKeys.add(key)
    inserts.push({
      name: tech,
      category: inferSkillCategory(tech),
      proficiency: null,
      display_order: displayOrder,
      show_on_landing: false,
    })
    displayOrder += 1
  }

  if (inserts.length === 0) {
    return 0
  }

  const { error: insertError } = await supabase.from("skills").insert(inserts)

  if (insertError) {
    throw new Error(insertError.message)
  }

  return inserts.length
}
