import { resolveTechStackIcon } from "@/features/portfolio/lib/experience-tech-stack"
import type { Skill } from "@/shared/types/database.helpers"

export const SKILLS_SHOWCASE_ORDER = [
  "AI Engineering",
  "Frameworks",
  "Cloud & Infrastructure",
] as const

export type SkillsShowcaseCategory = (typeof SKILLS_SHOWCASE_ORDER)[number]

export type SkillsShowcaseItem = {
  id: string
  label: string
  icon: string
}

const SHOWCASE_ICON_OVERRIDES: Record<string, string> = {
  openai: "simple-icons:openai",
  "azure openai": "simple-icons:microsoftazure",
  langgraph: "simple-icons:langgraph",
  langchain: "simple-icons:langchain",
  "hugging face": "simple-icons:huggingface",
  tensorflow: "simple-icons:tensorflow",
  qdrant: "simple-icons:qdrant",
  faiss: "lucide:search",
  rag: "lucide:brain-circuit",
  python: "simple-icons:python",
  typescript: "simple-icons:typescript",
  fastapi: "simple-icons:fastapi",
  "next.js": "simple-icons:nextdotjs",
  react: "simple-icons:react",
  azure: "simple-icons:microsoftazure",
  "aws sagemaker": "simple-icons:amazonaws",
  docker: "simple-icons:docker",
  postgresql: "simple-icons:postgresql",
  supabase: "simple-icons:supabase",
  "github actions": "simple-icons:githubactions",
  mlflow: "simple-icons:mlflow",
  "multi-agent": "lucide:bot",
  "prompt engineering": "lucide:message-square-text",
  "llm evaluation": "lucide:gauge",
  "azure ai search": "simple-icons:microsoftazure",
  lora: "lucide:sliders-horizontal",
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase()
}

export function normalizeSkillKey(value: string): string {
  return normalizeKey(value)
}

export function resolveShowcaseLabel(name: string): string {
  return name.trim()
}

export function resolveShowcaseCategory(skill: Skill): SkillsShowcaseCategory {
  if (skill.category === "ai_ml" || skill.category === "language") {
    return "AI Engineering"
  }

  if (skill.category === "framework") return "Frameworks"

  return "Cloud & Infrastructure"
}

export function resolveShowcaseIcon(name: string, label?: string): string {
  const keys = [normalizeKey(label ?? name), normalizeKey(name)]

  for (const key of keys) {
    if (SHOWCASE_ICON_OVERRIDES[key]) {
      return SHOWCASE_ICON_OVERRIDES[key]
    }
  }

  return resolveTechStackIcon(label ?? name)
}
