import { AI_FIRST_KEYWORDS } from "@/lib/public/ai-first-content"

export type AiFirstKeywordIconName =
  | "Sparkles"
  | "Server"
  | "GitBranch"
  | "Wand2"
  | "Network"
  | "Database"
  | "Workflow"
  | "Braces"
  | "ClipboardCheck"
  | "Rocket"

export type AiFirstKeywordDetail = {
  label: (typeof AI_FIRST_KEYWORDS)[number]
  description: string
  icon: AiFirstKeywordIconName
}

export const AI_FIRST_KEYWORD_DETAILS: AiFirstKeywordDetail[] = [
  {
    label: "AI-first engineering",
    icon: "Sparkles",
    description:
      "Design systems where agents, models, and tools are the default interface — not a late add-on.",
  },
  {
    label: "MCP servers",
    icon: "Server",
    description:
      "Expose Gmail, GitHub, Supabase, and internal APIs as safe tool layers agents can call at runtime.",
  },
  {
    label: "custom pipelines",
    icon: "GitBranch",
    description:
      "Python and FastAPI jobs for ingestion, batch inference, eval runners, and cron-friendly automation.",
  },
  {
    label: "agent skills",
    icon: "Wand2",
    description:
      "Reusable playbooks that encode conventions, review steps, and domain-specific workflows for agents.",
  },
  {
    label: "LLM orchestration",
    icon: "Network",
    description:
      "Multi-step flows with branching, memory, failover, and human-in-the-loop checkpoints.",
  },
  {
    label: "RAG",
    icon: "Database",
    description:
      "Ground agents in docs, tickets, and past conversations with embeddings, rerankers, and citations.",
  },
  {
    label: "workflow automation",
    icon: "Workflow",
    description:
      "n8n, Make, and webhook glue that connects SaaS tools to agent triggers and alert routing.",
  },
  {
    label: "structured outputs",
    icon: "Braces",
    description:
      "Schema-enforced JSON so every model response carries category, confidence, and citation fields.",
  },
  {
    label: "evals",
    icon: "ClipboardCheck",
    description:
      "Regression harnesses for prompts, tool calls, and retrieval quality before shipping changes.",
  },
  {
    label: "production AI systems",
    icon: "Rocket",
    description:
      "Observable, rate-limited, and RLS-safe paths built to stay reliable under real traffic.",
  },
]

const KEYWORD_DETAIL_MAP = new Map(
  AI_FIRST_KEYWORD_DETAILS.map((detail) => [detail.label, detail])
)

export function getAiFirstKeywordDetail(
  keyword: string
): AiFirstKeywordDetail | undefined {
  return KEYWORD_DETAIL_MAP.get(keyword as AiFirstKeywordDetail["label"])
}
