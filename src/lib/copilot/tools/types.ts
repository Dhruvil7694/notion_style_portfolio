export type CopilotToolName =
  | "createProject"
  | "updateProject"
  | "createContent"
  | "updateContent"
  | "createSkill"
  | "updateSkill"
  | "createTechnology"
  | "createConcept"
  | "generateAiSummary"
  | "generateFaq"
  | "generateKeyTakeaways"
  | "generateTradeoffs"
  | "auditProject"
  | "auditPortfolio"
  | "searchKnowledgeGraph"
  | "suggestRelationships"
  | "generateCaseStudy"
  | "applyFaq"
  | "applySummary"
  | "applyTakeaways"
  | "applyTradeoffs"
  | "applyTechnologies"
  | "applyExpertise"
  | "applyConcepts"
  | "applyRelationships"
  | "updateAboutSection"

export type CopilotToolDefinition = {
  name: CopilotToolName
  description: string
  requiresConfirmation: boolean
  parameters: Record<string, { type: string; description: string; required?: boolean }>
}

export type CopilotToolExecutionResult = {
  success: boolean
  data?: unknown
  error?: string
  requiresConfirmation?: boolean
  preview?: unknown
}

export const COPILOT_TOOLS: CopilotToolDefinition[] = [
  {
    name: "createProject",
    description: "Create a new portfolio project",
    requiresConfirmation: true,
    parameters: {
      title: { type: "string", description: "Project title", required: true },
      slug: { type: "string", description: "URL slug", required: true },
      summary: { type: "string", description: "Short summary", required: true },
    },
  },
  {
    name: "updateProject",
    description: "Update an existing project by slug",
    requiresConfirmation: true,
    parameters: {
      slug: { type: "string", description: "Project slug", required: true },
      updates: { type: "object", description: "Fields to update", required: true },
    },
  },
  {
    name: "createContent",
    description: "Create blog, research, or automation content",
    requiresConfirmation: true,
    parameters: {
      type: { type: "string", description: "Content type", required: true },
      title: { type: "string", description: "Content title", required: true },
      slug: { type: "string", description: "URL slug", required: true },
    },
  },
  {
    name: "updateContent",
    description: "Update existing content by slug",
    requiresConfirmation: true,
    parameters: {
      slug: { type: "string", description: "Content slug", required: true },
      updates: { type: "object", description: "Fields to update", required: true },
    },
  },
  {
    name: "createSkill",
    description: "Add a new skill to the taxonomy",
    requiresConfirmation: true,
    parameters: {
      name: { type: "string", description: "Skill name", required: true },
      category: { type: "string", description: "Skill category", required: true },
    },
  },
  {
    name: "updateSkill",
    description: "Update an existing skill",
    requiresConfirmation: true,
    parameters: {
      id: { type: "string", description: "Skill ID", required: true },
      updates: { type: "object", description: "Fields to update", required: true },
    },
  },
  {
    name: "createTechnology",
    description: "Register a new technology hub page",
    requiresConfirmation: true,
    parameters: {
      title: { type: "string", description: "Technology title", required: true },
      slug: { type: "string", description: "URL slug", required: true },
    },
  },
  {
    name: "createConcept",
    description: "Register a new concept authority page",
    requiresConfirmation: true,
    parameters: {
      title: { type: "string", description: "Concept title", required: true },
      slug: { type: "string", description: "URL slug", required: true },
    },
  },
  {
    name: "generateAiSummary",
    description: "Generate an AI summary preview for a project or content item",
    requiresConfirmation: false,
    parameters: {
      entityType: { type: "string", description: "project or content", required: true },
      slug: { type: "string", description: "Entity slug", required: true },
    },
  },
  {
    name: "generateFaq",
    description: "Generate FAQ preview for a project",
    requiresConfirmation: false,
    parameters: {
      slug: { type: "string", description: "Project slug", required: true },
    },
  },
  {
    name: "generateKeyTakeaways",
    description: "Generate key takeaways preview",
    requiresConfirmation: false,
    parameters: {
      slug: { type: "string", description: "Project slug", required: true },
    },
  },
  {
    name: "generateTradeoffs",
    description: "Generate tradeoffs preview for a project",
    requiresConfirmation: false,
    parameters: {
      slug: { type: "string", description: "Project slug", required: true },
    },
  },
  {
    name: "auditProject",
    description: "Audit a single project health score",
    requiresConfirmation: false,
    parameters: {
      slug: { type: "string", description: "Project slug", required: true },
    },
  },
  {
    name: "auditPortfolio",
    description: "Run a full portfolio health audit",
    requiresConfirmation: false,
    parameters: {},
  },
  {
    name: "searchKnowledgeGraph",
    description: "Search the knowledge graph for entities",
    requiresConfirmation: false,
    parameters: {
      query: { type: "string", description: "Search query", required: true },
    },
  },
  {
    name: "suggestRelationships",
    description: "Suggest missing knowledge graph relationships",
    requiresConfirmation: false,
    parameters: {
      entityType: { type: "string", description: "Entity type", required: true },
      entitySlug: { type: "string", description: "Entity slug", required: true },
    },
  },
  {
    name: "generateCaseStudy",
    description: "Generate a case study overview preview",
    requiresConfirmation: false,
    parameters: {
      slug: { type: "string", description: "Project slug", required: true },
    },
  },
  {
    name: "applyFaq",
    description: "Apply generated FAQ to a project (requires approval)",
    requiresConfirmation: true,
    parameters: {
      slug: { type: "string", description: "Project slug", required: true },
      content: { type: "object", description: "FAQ items to apply", required: true },
    },
  },
  {
    name: "applySummary",
    description: "Apply generated AI summary (requires approval)",
    requiresConfirmation: true,
    parameters: {
      slug: { type: "string", description: "Project slug", required: true },
      content: { type: "string", description: "Summary text", required: true },
    },
  },
  {
    name: "applyTakeaways",
    description: "Apply key takeaways (requires approval)",
    requiresConfirmation: true,
    parameters: {
      slug: { type: "string", description: "Project slug", required: true },
      content: { type: "array", description: "Takeaways array", required: true },
    },
  },
  {
    name: "applyTradeoffs",
    description: "Apply tradeoffs (requires approval)",
    requiresConfirmation: true,
    parameters: {
      slug: { type: "string", description: "Project slug", required: true },
      content: { type: "array", description: "Tradeoffs array", required: true },
    },
  },
  {
    name: "applyTechnologies",
    description: "Apply technology links (requires approval)",
    requiresConfirmation: true,
    parameters: {
      slug: { type: "string", description: "Project slug", required: true },
      content: { type: "array", description: "Technology slugs", required: true },
    },
  },
  {
    name: "applyExpertise",
    description: "Apply expertise links (requires approval)",
    requiresConfirmation: true,
    parameters: {
      slug: { type: "string", description: "Project slug", required: true },
      content: { type: "array", description: "Expertise slugs", required: true },
    },
  },
  {
    name: "applyConcepts",
    description: "Apply concept links (requires approval)",
    requiresConfirmation: true,
    parameters: {
      slug: { type: "string", description: "Project slug", required: true },
      content: { type: "array", description: "Concept slugs", required: true },
    },
  },
  {
    name: "applyRelationships",
    description: "Apply multiple relationship links (requires approval)",
    requiresConfirmation: true,
    parameters: {
      slug: { type: "string", description: "Project slug", required: true },
      content: { type: "object", description: "Relationship payload", required: true },
    },
  },
  {
    name: "updateAboutSection",
    description:
      "Propose an edit to an About page field. Provide either newContent or instruction (LLM rewrites current text). Requires confirmation before writing.",
    requiresConfirmation: true,
    parameters: {
      field: {
        type: "string",
        description:
          "About field key: intro, intro_tools, career_intro, after_umbrella, retrieval, ownership, outside, or mcp",
        required: true,
      },
      newContent: {
        type: "string",
        description: "Exact replacement text (optional if instruction provided)",
      },
      instruction: {
        type: "string",
        description:
          "Rewrite instruction (optional if newContent provided). Example: 'make it warmer, keep keywords'",
      },
    },
  },
]

export function getToolDefinition(name: CopilotToolName): CopilotToolDefinition | undefined {
  return COPILOT_TOOLS.find((tool) => tool.name === name)
}
