import { z } from "zod"

export const ABOUT_TAGS = [
  "Applied AI Engineer",
  "RAG systems",
  "Production-first",
  "Ships over slides",
  "Agent workflows",
  "Python & FastAPI",
] as const

export const ABOUT_FLIP_KEYWORDS = [
  "LangChain",
  "LangGraph",
  "Azure OpenAI",
  "RAG",
  "FastAPI",
  "MCP",
  "NL-to-SQL",
  "Vector DBs",
  "Agentic AI",
  "Python",
  "PostgreSQL",
  "Automations",
] as const

export const ABOUT_INTRO =
  "I build AI systems and automations that need to work after demo day — RAG pipelines, agent workflows, and internal tools people actually open on a Monday."

export const ABOUT_INTRO_TOOLS =
  "LangChain, LangGraph, FastAPI, and a lot of debugging in between."

export const ABOUT_CAREER_INTRO =
  "At 1POINT1 I work on NL-to-SQL and document pipelines; before that, GenAI and compliance tooling at Cyber Security Umbrella."

export const ABOUT_AFTER_UMBRELLA =
  "That stretch — shipping under compliance pressure, then production AI — taught me to care about evals, guardrails, and the boring parts that keep systems running. I explore tools hands-on before asking a team to adopt them, and I'd rather ship something small that works than demo something big that doesn't."

export const ABOUT_SECONDARY_DEFAULT = `${ABOUT_CAREER_INTRO} ${ABOUT_AFTER_UMBRELLA}`

export const ABOUT_PARAGRAPHS = {
  retrieval:
    "Shipping taught me that getting retrieval right matters more than swapping models — chunk size, evals, and knowing when RAG is the wrong tool changed how I build and how I talk to teams about what's realistic.",
  ownership:
    "I like owning problems end to end: schema design, API contracts, the prompt that breaks at 2am, and the dashboard someone actually opens. Early enough in my career to stay hands-on, far enough in to know when not to over-engineer.",
  outside:
    "Outside work I read papers I half understand, break side projects, and follow how teams are actually adopting agents — not just the launch tweets. Composition and curiosity from photography and music still show up in how I think about interfaces and flow.",
  mcp: "Lately I've been exploring what MCP and tool-calling mean for real internal workflows — not as an expert, but as someone figuring it out. If you're in the same boat, happy to think through it together.",
} as const

export const aboutContentSchema = z.object({
  intro: z.string().default(ABOUT_INTRO),
  intro_tools: z.string().default(ABOUT_INTRO_TOOLS),
  career_intro: z.string().default(ABOUT_CAREER_INTRO),
  after_umbrella: z.string().default(ABOUT_AFTER_UMBRELLA),
  retrieval: z.string().default(ABOUT_PARAGRAPHS.retrieval),
  ownership: z.string().default(ABOUT_PARAGRAPHS.ownership),
  outside: z.string().default(ABOUT_PARAGRAPHS.outside),
  mcp: z.string().default(ABOUT_PARAGRAPHS.mcp),
  tags: z.array(z.string()).default([...ABOUT_TAGS]),
  flip_keywords: z.array(z.string()).default([...ABOUT_FLIP_KEYWORDS]),
})

export type AboutContent = z.infer<typeof aboutContentSchema>

export const DEFAULT_ABOUT_CONTENT: AboutContent = aboutContentSchema.parse({})

export function parseAboutContent(value: unknown): AboutContent {
  return aboutContentSchema.parse(value ?? {})
}
