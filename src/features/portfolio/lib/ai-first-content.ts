export type AiFirstAutomationTool = {
  id: string
  category: string
  tool: string
  icon: string
  useFor: string
  notes?: string
}

export type AiFirstTool = {
  name: string
  role: string
  icon: string
  description: string
}

export type AiFirstUseCase = {
  id: string
  title: string
  problem: string
  approach: string
  tools: AiFirstTool[]
  keywords: string[]
}

export const AI_FIRST_SUMMARY_POINTS = [
  "I design workflows where AI is the default interface — not a bolt-on — using skills, MCP servers, and custom pipelines to move from idea to production faster.",
  "Every build starts with task decomposition: what should be automated, what needs human review, and which model or tool fits each step.",
  "Production systems combine RAG, agents, structured outputs, and observability so automations stay reliable under real load.",
] as const

export const AI_FIRST_KEYWORDS = [
  "AI-first engineering",
  "MCP servers",
  "custom pipelines",
  "agent skills",
  "LLM orchestration",
  "RAG",
  "workflow automation",
  "structured outputs",
  "evals",
  "production AI systems",
] as const

export const AI_FIRST_AUTOMATION_TOOLS: AiFirstAutomationTool[] = [
  {
    id: "chatgpt",
    category: "LLM",
    tool: "ChatGPT",
    icon: "simple-icons:openai",
    useFor: "Fast drafting, brainstorming, and structured JSON outputs",
    notes: "GPT-4o / o-series for quick iteration loops",
  },
  {
    id: "claude",
    category: "LLM",
    tool: "Claude",
    icon: "simple-icons:anthropic",
    useFor: "Long-context reasoning, code review, and agent orchestration",
    notes: "Sonnet for daily work · Opus for hard problems",
  },
  {
    id: "gemini",
    category: "LLM",
    tool: "Gemini",
    icon: "simple-icons:googlegemini",
    useFor: "Multimodal ingestion and Google Workspace-adjacent flows",
  },
  {
    id: "cursor",
    category: "Agent IDE",
    tool: "Cursor",
    icon: "simple-icons:cursor",
    useFor: "Repo-aware edits, refactors, and skill-driven workflows",
    notes: "Primary IDE for AI-first delivery",
  },
  {
    id: "claude-code",
    category: "Agent IDE",
    tool: "Claude Code",
    icon: "simple-icons:anthropic",
    useFor: "Terminal agents, multi-file changes, and CI-adjacent automation",
  },
  {
    id: "agent-skills",
    category: "Skills",
    tool: "Agent Skills",
    icon: "lucide:sparkles",
    useFor: "Reusable task playbooks (GSAP, MCP, npm, superpowers, etc.)",
    notes: "Cursor + Claude skill libraries",
  },
  {
    id: "custom-skills",
    category: "Custom Skills",
    tool: "Custom portfolio skills",
    icon: "lucide:wrench",
    useFor: "Project-specific conventions, commit flows, and domain prompts",
    notes: "Tailored to this codebase and delivery style",
  },
  {
    id: "mcp-custom",
    category: "MCP",
    tool: "Custom MCP servers",
    icon: "simple-icons:modelcontextprotocol",
    useFor: "Gmail, GitHub, Supabase, Stripe, and internal APIs",
    notes: "Tool layer agents call safely at runtime",
  },
  {
    id: "mcp-context7",
    category: "MCP",
    tool: "Context7 MCP",
    icon: "lucide:book-open-text",
    useFor: "Live library docs during implementation",
  },
  {
    id: "langgraph",
    category: "Orchestration",
    tool: "LangGraph",
    icon: "simple-icons:langgraph",
    useFor: "Multi-step agents with branches, memory, and human-in-the-loop",
  },
  {
    id: "n8n",
    category: "Automation",
    tool: "n8n",
    icon: "simple-icons:n8n",
    useFor: "Webhook triggers, scheduled jobs, and no-code glue",
  },
  {
    id: "make",
    category: "Automation",
    tool: "Make (Integromat)",
    icon: "simple-icons:integromat",
    useFor: "SaaS-to-SaaS automations and alert routing",
  },
  {
    id: "python-scripts",
    category: "Custom Pipelines",
    tool: "Python scripts",
    icon: "simple-icons:python",
    useFor: "ETL, batch inference, eval runners, and cron-friendly jobs",
    notes: "FastAPI + asyncio for production paths",
  },
  {
    id: "rag-stack",
    category: "RAG",
    tool: "Embeddings + vector store",
    icon: "simple-icons:supabase",
    useFor: "Grounding agents in docs, tickets, and past conversations",
    notes: "Supabase pgvector · rerankers where precision matters",
  },
  {
    id: "evals",
    category: "Quality",
    tool: "Eval harnesses",
    icon: "lucide:clipboard-check",
    useFor: "Regression checks on prompts, tool calls, and retrieval",
  },
  {
    id: "observability",
    category: "Observability",
    tool: "Logging + tracing",
    icon: "lucide:activity",
    useFor: "Agent step logs, latency tracking, and failure replay",
    notes: "Structured logs for every tool invocation",
  },
  {
    id: "whisper",
    category: "Voice / Media",
    tool: "Whisper / transcription APIs",
    icon: "simple-icons:openai",
    useFor: "Meeting notes and voice-to-task pipelines",
  },
  {
    id: "github-actions",
    category: "CI/CD",
    tool: "GitHub Actions",
    icon: "simple-icons:githubactions",
    useFor: "Deploy hooks, scheduled agents, and PR automation",
  },
  {
    id: "github-mcp",
    category: "MCP",
    tool: "GitHub MCP",
    icon: "simple-icons:github",
    useFor: "Issues, PRs, and repo context inside agent loops",
  },
  {
    id: "stripe-mcp",
    category: "MCP",
    tool: "Stripe MCP",
    icon: "simple-icons:stripe",
    useFor: "Billing lookups, customer context, and payment workflows",
  },
  {
    id: "fastapi",
    category: "Custom Pipelines",
    tool: "FastAPI",
    icon: "simple-icons:fastapi",
    useFor: "Agent APIs, webhooks, and production inference endpoints",
  },
  {
    id: "docker",
    category: "Infrastructure",
    tool: "Docker",
    icon: "simple-icons:docker",
    useFor: "Containerized agents, workers, and reproducible deploys",
  },
]

export const AI_FIRST_USE_CASES: AiFirstUseCase[] = [
  {
    id: "email-automation",
    title: "Email & inbox automation",
    problem:
      "High-volume inboxes with repetitive triage, follow-ups, and drafting burn time without consistent quality.",
    approach:
      "Classify intent with a lightweight model, route to MCP-connected CRM or calendar tools, draft replies from approved templates, and queue human review for edge cases.",
    keywords: ["email automation", "MCP", "inbox triage", "draft generation"],
    tools: [
      {
        name: "Gmail / Outlook API",
        role: "Source of truth",
        icon: "simple-icons:gmail",
        description: "Fetch threads, labels, and send approved replies.",
      },
      {
        name: "MCP server (custom)",
        role: "Tool layer",
        icon: "simple-icons:modelcontextprotocol",
        description:
          "Expose search, calendar, and CRM actions to the agent safely.",
      },
      {
        name: "LangGraph / agent runner",
        role: "Orchestration",
        icon: "simple-icons:langgraph",
        description: "Branch on intent, enforce policies, and log each step.",
      },
      {
        name: "Vector store + RAG",
        role: "Context",
        icon: "simple-icons:supabase",
        description:
          "Ground drafts in past threads, playbooks, and product docs.",
      },
    ],
  },
  {
    id: "research-workflows",
    title: "Research & knowledge synthesis",
    problem:
      "Scattered papers, docs, and notes make it hard to produce decision-ready summaries quickly.",
    approach:
      "Ingest sources into a pipeline, chunk and embed with metadata, run multi-step synthesis agents, and export structured briefs with citations.",
    keywords: [
      "research automation",
      "RAG pipeline",
      "citations",
      "knowledge synthesis",
    ],
    tools: [
      {
        name: "Custom ingestion pipeline",
        role: "ETL",
        icon: "lucide:workflow",
        description:
          "Normalize PDFs, URLs, and notes into a searchable corpus.",
      },
      {
        name: "Embeddings + reranker",
        role: "Retrieval",
        icon: "simple-icons:huggingface",
        description: "Improve precision before the LLM sees context.",
      },
      {
        name: "Agent skills",
        role: "Reasoning",
        icon: "lucide:sparkles",
        description:
          "Separate summarize, compare, and critique steps for quality.",
      },
    ],
  },
  {
    id: "code-delivery",
    title: "Code delivery & review",
    problem:
      "Feature work repeats scaffolding, tests, and review loops that slow shipping.",
    approach:
      "Use repo-aware agents with skills for linting, test generation, and PR descriptions; keep humans on architecture and merge decisions.",
    keywords: ["AI coding", "agent skills", "CI integration", "code review"],
    tools: [
      {
        name: "IDE / CLI agents",
        role: "Implementation",
        icon: "simple-icons:cursor",
        description:
          "Scoped edits with project conventions baked into prompts.",
      },
      {
        name: "GitHub MCP",
        role: "Delivery",
        icon: "simple-icons:github",
        description:
          "Open PRs, attach summaries, and link issues automatically.",
      },
      {
        name: "Eval harness",
        role: "Quality",
        icon: "lucide:clipboard-check",
        description:
          "Regression checks on prompts and tool calls before deploy.",
      },
    ],
  },
  {
    id: "customer-support",
    title: "Support & ops copilots",
    problem:
      "Support teams need fast, accurate answers pulled from docs, tickets, and runbooks.",
    approach:
      "Hybrid retrieval over FAQs and tickets, tool use for lookups, escalation rules, and feedback loops into the knowledge base.",
    keywords: [
      "support automation",
      "copilot",
      "ticket routing",
      "GEO/AEO content",
    ],
    tools: [
      {
        name: "Helpdesk API",
        role: "Channel",
        icon: "simple-icons:zendesk",
        description:
          "Create drafts, tags, and escalations in the existing stack.",
      },
      {
        name: "Structured output schemas",
        role: "Safety",
        icon: "lucide:braces",
        description:
          "Force category, confidence, and citation fields on every reply.",
      },
      {
        name: "Analytics pipeline",
        role: "Improvement",
        icon: "lucide:bar-chart-3",
        description: "Track deflection, latency, and retrieval misses weekly.",
      },
    ],
  },
]

export function getAiFirstUseCase(id: string): AiFirstUseCase | undefined {
  return AI_FIRST_USE_CASES.find((useCase) => useCase.id === id)
}
