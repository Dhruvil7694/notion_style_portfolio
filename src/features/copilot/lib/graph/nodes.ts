import "server-only"

import { AIMessage, SystemMessage } from "@langchain/core/messages"

import { createCopilotChatModel } from "@/features/ai/lib/models"
import { buildCopilotContextPrompt } from "@/features/ai/lib/prompts"
import type {
  CopilotIntent,
  CopilotPendingAction,
} from "@/features/ai/lib/types"
import type { CopilotToolName } from "@/features/copilot/lib/tools"
import {
  buildCopilotToolDescriptions,
  executeCopilotTool,
} from "@/features/copilot/lib/tools"

import type { CopilotGraphState } from "./state"

function getLastUserMessage(state: CopilotGraphState): string {
  const humanMessages = state.messages.filter((m) => m._getType() === "human")
  const last = humanMessages[humanMessages.length - 1]
  return last ? String(last.content) : ""
}

const ABOUT_FIELD_HINTS: Array<{ field: string; keywords: RegExp }> = [
  {
    field: "intro_tools",
    keywords: /\b(tools\s+line|stack\s+line|toolchain)\b/i,
  },
  { field: "career_intro", keywords: /\b(career|1point1|umbrella)\b/i },
  {
    field: "after_umbrella",
    keywords: /\b(after\s+umbrella|production\s+ai|evals|guardrails)\b/i,
  },
  { field: "retrieval", keywords: /\b(retrieval|rag\s+paragraph|chunk)\b/i },
  {
    field: "ownership",
    keywords: /\b(ownership|end\s+to\s+end|over-?engineer)\b/i,
  },
  {
    field: "outside",
    keywords: /\b(outside\s+work|hobby|photography|music|papers)\b/i,
  },
  {
    field: "mcp",
    keywords: /\b(mcp\s+paragraph|tool[-\s]calling\s+paragraph)\b/i,
  },
]

function detectAboutField(message: string): string {
  for (const hint of ABOUT_FIELD_HINTS) {
    if (hint.keywords.test(message)) return hint.field
  }
  return "intro"
}

function looksLikeAboutEdit(message: string): boolean {
  return /\b(about\s+(me|section|page|content|paragraph|tagline|intro))\b/i.test(
    message
  )
}

function humanizeAboutField(field: string): string {
  switch (field) {
    case "intro":
      return "intro paragraph"
    case "intro_tools":
      return "tools/stack line"
    case "career_intro":
      return "career intro paragraph"
    case "after_umbrella":
      return "post-Umbrella paragraph"
    case "retrieval":
      return "retrieval paragraph"
    case "ownership":
      return "ownership paragraph"
    case "outside":
      return "outside-work paragraph"
    case "mcp":
      return "MCP paragraph"
    default:
      return `${field} field`
  }
}

export async function detectIntentNode(
  state: CopilotGraphState
): Promise<Partial<CopilotGraphState>> {
  const message = getLastUserMessage(state)
  const lower = message.toLowerCase()

  let intent: CopilotIntent = "general"

  if (looksLikeAboutEdit(message)) {
    intent = "update_content"
  } else if (/audit|health|missing|quality|score/.test(lower)) {
    intent = "audit"
  } else if (/create|add|new project|new skill/.test(lower)) {
    intent = "create_content"
  } else if (/update|edit|change|fix|rewrite|reword/.test(lower)) {
    intent = "update_content"
  } else if (/generate|write|draft|summary|faq|takeaway|tradeoff/.test(lower)) {
    intent = "generate_content"
  } else if (/link|relationship|connect|associate/.test(lower)) {
    intent = "relationships"
  } else if (/search|find|show|list/.test(lower)) {
    intent = "search"
  }

  return { intent }
}

export async function buildContextNode(
  state: CopilotGraphState
): Promise<Partial<CopilotGraphState>> {
  const toolDescriptions = await buildCopilotToolDescriptions()
  const contextText = [
    state.contextText,
    `\nDetected intent: ${state.intent}`,
    `\nAvailable tools:\n${toolDescriptions}`,
  ]
    .filter(Boolean)
    .join("\n")

  return { contextText }
}

export async function selectToolsNode(
  state: CopilotGraphState
): Promise<Partial<CopilotGraphState>> {
  const message = getLastUserMessage(state)
  const toolCalls: CopilotGraphState["toolCalls"] = []
  const lower = message.toLowerCase()

  if (looksLikeAboutEdit(message)) {
    const field = detectAboutField(message)
    const quoted = message.match(/["“']([^"”']{8,})["”']/)
    const newContent = quoted?.[1]?.trim()
    toolCalls.push({
      id: crypto.randomUUID(),
      name: "updateAboutSection",
      args: newContent
        ? { field, newContent }
        : { field, instruction: message },
      requiresConfirmation: true,
    })
    return { toolCalls }
  }

  if (state.intent === "audit" && /portfolio|all|overall/.test(lower)) {
    toolCalls.push({
      id: crypto.randomUUID(),
      name: "auditPortfolio",
      args: {},
      requiresConfirmation: false,
    })
  } else if (state.intent === "audit") {
    const slugMatch = message.match(/(?:project\s+)?([a-z0-9-]+)/i)
    if (slugMatch) {
      toolCalls.push({
        id: crypto.randomUUID(),
        name: "auditProject",
        args: { slug: slugMatch[1] },
        requiresConfirmation: false,
      })
    } else {
      toolCalls.push({
        id: crypto.randomUUID(),
        name: "auditPortfolio",
        args: {},
        requiresConfirmation: false,
      })
    }
  }

  if (state.intent === "search" || /langgraph|bohrai|rag/.test(lower)) {
    toolCalls.push({
      id: crypto.randomUUID(),
      name: "searchKnowledgeGraph",
      args: { query: message },
      requiresConfirmation: false,
    })
  }

  if (state.intent === "relationships") {
    const techMatch = message.match(
      /(?:technology|skill|concept)\s+([a-z0-9-]+)/i
    )
    if (techMatch) {
      toolCalls.push({
        id: crypto.randomUUID(),
        name: "suggestRelationships",
        args: { entityType: "technology", entitySlug: techMatch[1] },
        requiresConfirmation: false,
      })
    }
  }

  if (state.intent === "generate_content") {
    if (/faq/.test(lower)) {
      toolCalls.push({
        id: crypto.randomUUID(),
        name: "generateFaq",
        args: { slug: extractSlug(message) },
        requiresConfirmation: false,
      })
    } else if (/summary/.test(lower)) {
      toolCalls.push({
        id: crypto.randomUUID(),
        name: "generateAiSummary",
        args: { entityType: "project", slug: extractSlug(message) },
        requiresConfirmation: false,
      })
    }
  }

  return { toolCalls }
}

function extractSlug(message: string): string {
  const match = message.match(/(?:for|project)\s+([a-z0-9-]+)/i)
  return match?.[1] ?? "bohrai"
}

function describeAction(name: string): { label: string; description: string } {
  switch (name) {
    case "updateAboutSection":
      return {
        label: "Apply About edit",
        description: "Write the proposed text to the About page setting.",
      }
    case "applyFaq":
      return {
        label: "Apply FAQ",
        description: "Save the generated FAQ to the project.",
      }
    case "applySummary":
      return {
        label: "Apply summary",
        description: "Save the generated AI summary.",
      }
    case "applyTakeaways":
      return {
        label: "Apply takeaways",
        description: "Save the key takeaways.",
      }
    case "applyTradeoffs":
      return { label: "Apply tradeoffs", description: "Save the tradeoffs." }
    case "applyTechnologies":
      return {
        label: "Apply technologies",
        description: "Update technology links.",
      }
    case "applyExpertise":
      return {
        label: "Apply expertise",
        description: "Update expertise links.",
      }
    case "applyConcepts":
      return { label: "Apply concepts", description: "Update concept links." }
    case "applyRelationships":
      return {
        label: "Apply relationships",
        description: "Update relationship links.",
      }
    case "createProject":
      return {
        label: "Create project",
        description: "Insert the new project as draft.",
      }
    case "updateProject":
      return {
        label: "Update project",
        description: "Write the proposed project changes.",
      }
    case "createSkill":
      return {
        label: "Create skill",
        description: "Add the new skill to the taxonomy.",
      }
    case "createTechnology":
      return {
        label: "Create technology",
        description: "Register the technology page.",
      }
    case "createConcept":
      return {
        label: "Create concept",
        description: "Register the concept page.",
      }
    default:
      return { label: "Confirm", description: "Apply this change." }
  }
}

export async function executeToolsNode(
  state: CopilotGraphState
): Promise<Partial<CopilotGraphState>> {
  const toolResults: CopilotGraphState["toolResults"] = []
  const pendingActions: CopilotPendingAction[] = []
  let pendingConfirmation = false

  for (const toolCall of state.toolCalls) {
    const result = await executeCopilotTool(
      toolCall.name as CopilotToolName,
      toolCall.args,
      { confirmed: false }
    )

    toolResults.push({
      toolCallId: toolCall.id,
      name: toolCall.name,
      success: result.success,
      data: result.data,
      error: result.error,
      requiresConfirmation: result.requiresConfirmation,
      preview: result.preview,
    })

    if (toolCall.requiresConfirmation || result.requiresConfirmation) {
      if (!result.success) {
        // Surface failure as text response; no pending button card.
        continue
      }
      pendingConfirmation = true
      const { label, description } = describeAction(toolCall.name)
      const preview =
        (result.data &&
        typeof result.data === "object" &&
        "preview" in (result.data as Record<string, unknown>)
          ? (result.data as { preview: unknown }).preview
          : result.preview) ?? null

      let pendingArgs = toolCall.args
      if (
        toolCall.name === "updateAboutSection" &&
        preview &&
        typeof preview === "object"
      ) {
        const p = preview as {
          field?: string
          variants?: Array<{ text: string }>
          instruction?: string
        }
        pendingArgs = {
          ...toolCall.args,
          field: p.field ?? toolCall.args.field,
          variants: p.variants?.map((v) => v.text) ?? [],
          instruction: p.instruction,
        }
      }

      pendingActions.push({
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        args: pendingArgs,
        label,
        description,
        preview,
      })
    }
  }

  return { toolResults, pendingActions, pendingConfirmation }
}

export async function validateNode(
  state: CopilotGraphState
): Promise<Partial<CopilotGraphState>> {
  const failed = state.toolResults.filter((result) => !result.success)
  if (failed.length > 0) {
    return {
      error:
        failed
          .map((f) => f.error)
          .filter(Boolean)
          .join("; ") || "Tool validation failed",
    }
  }
  return {}
}

export async function respondNode(
  state: CopilotGraphState
): Promise<Partial<CopilotGraphState>> {
  if (state.error) {
    const response = `Couldn't complete that. ${state.error}`
    return { response, messages: [new AIMessage(response)] }
  }

  if (state.pendingActions.length > 0) {
    const action = state.pendingActions[0]!
    const preview = action.preview as
      | {
          kind?: string
          field?: string
          before?: string
          after?: string
          variants?: Array<{ label: string; text: string }>
        }
      | null
      | undefined

    if (action.toolName === "updateAboutSection") {
      const fieldLabel = humanizeAboutField(preview?.field ?? "intro")
      const count = preview?.variants?.length ?? (preview?.after ? 1 : 0)
      const response =
        count > 1
          ? `Here are ${count} ways to rewrite your ${fieldLabel}. Pick the one that sounds most like you, or hit Regenerate for fresh takes.`
          : `Here's a rewrite for your ${fieldLabel}. Take a look — confirm if it works, or cancel if not.`
      return { response, messages: [new AIMessage(response)] }
    }

    const response = `Ready when you are. Confirm to ${action.label.toLowerCase().replace(/^apply\s+/, "apply the ")}, or cancel to skip.`
    return { response, messages: [new AIMessage(response)] }
  }

  const model = await createCopilotChatModel()
  const systemPrompt = buildCopilotContextPrompt(state.contextText)

  const toolSummary =
    state.toolResults.length > 0
      ? `\n\nTool Results (already executed, do not re-promise):\n${JSON.stringify(state.toolResults, null, 2)}`
      : ""

  const response = await model.invoke([
    new SystemMessage(
      systemPrompt +
        toolSummary +
        "\n\nIMPORTANT: Do NOT promise to perform actions or ask the user to confirm in chat. If a confirmation is required, the UI handles it with buttons. Just summarize results."
    ),
    ...state.messages,
  ])

  const content =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content)

  let finalResponse = content

  if (
    state.intent === "audit" &&
    state.toolResults.some((r) => r.name === "auditPortfolio")
  ) {
    const auditData = state.toolResults.find((r) => r.name === "auditPortfolio")
      ?.data as
      | { score?: number; portfolioIssues?: { message: string }[] }
      | undefined

    if (auditData?.portfolioIssues) {
      const issues = auditData.portfolioIssues
        .slice(0, 10)
        .map((i) => `- ${i.message}`)
        .join("\n")
      finalResponse = `Portfolio Health Score: ${auditData.score ?? "N/A"}%\n\nFound:\n${issues}\n\nWould you like me to generate fixes?`
    }
  }

  return {
    response: finalResponse,
    messages: [new AIMessage(finalResponse)],
  }
}
