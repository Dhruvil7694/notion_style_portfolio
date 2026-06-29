export const DEFAULT_EXPERTISE_SLUGS = [
  "ai-engineering",
  "rag-systems",
  "multi-agent-systems",
  "document-intelligence",
  "enterprise-automation",
  "mlops",
  "evaluation-systems",
  "vector-search",
  "knowledge-systems",
  "ai-infrastructure",
] as const

export const DEFAULT_CONCEPTS = [
  "RAG",
  "Multi-Agent Systems",
  "Vector Search",
  "Document Intelligence",
  "Hybrid Retrieval",
  "Citation Validation",
  "Hallucination Reduction",
  "Knowledge Graph",
  "LLM Orchestration",
  "Semantic Search",
  "Evaluation",
  "Grounding",
] as const

export const TECHNOLOGY_ALIASES: Record<string, string> = {
  langgraph: "LangGraph",
  fastapi: "FastAPI",
  postgresql: "PostgreSQL",
  postgres: "PostgreSQL",
  gemini: "Gemini",
  openai: "OpenAI",
  claude: "Claude",
  anthropic: "Anthropic",
  python: "Python",
  react: "React",
  nextjs: "Next.js",
  "next.js": "Next.js",
  supabase: "Supabase",
  pinecone: "Pinecone",
  pgvector: "pgvector",
  sagemaker: "SageMaker",
  crewai: "CrewAI",
  langchain: "LangChain",
}

export function normalizeTechnologySlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function resolveTechnologyLabel(slug: string): string {
  const normalized = normalizeTechnologySlug(slug)
  return TECHNOLOGY_ALIASES[normalized] ?? slug
}
