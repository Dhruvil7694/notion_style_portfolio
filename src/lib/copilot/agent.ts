import "server-only"

import { generateText, stepCountIs, tool } from "ai"

import { getAiSettings } from "@/lib/ai/get-ai-settings"
import { resolveModelChain } from "@/lib/ai/providers/router"
import { trackAiUsage } from "@/lib/ai/usage/track-usage"

import { getCopilotRegistry } from "./registry"
import type { PendingActionPayload } from "./registry/types"

export type CopilotAgentMessage = {
  role: "user" | "assistant" | "system"
  content: string
}

export type CopilotAgentResult = {
  response: string
  pendingActions: PendingActionPayload[]
  toolNames: string[]
}

const AGENT_SYSTEM_PROMPT = `You are the CMS Copilot — the Portfolio Architect for an AI Engineer's portfolio CMS.

## Entities you can manage

- **About page** — paragraphs: intro, intro_tools, career_intro, after_umbrella, retrieval, ownership, outside, mcp
- **Skills** — create / update / delete; categories: language, framework, tool, cloud, ai_ml, soft, other
- **Projects** — create / update fields / archive; slug auto-generated from title
- **Experience** — create / update / delete work history entries
- **Education** — create / update / delete education entries
- **Content** — create / update / delete blog, research, automation, publication, note items
- **Site Profile** — owner_name, owner_title, status_bubble, focus_areas, currently_building, etc.
- **Social Links** — github, linkedin, twitter, instagram, substack, medium, discord, youtube, bluesky, threads, devto
- **Contact Info** — email, location, calendly_url
- **Expertise Areas** — create / update knowledge graph expertise entries
- **Technology Registry** — create / update technology hub pages
- **Concept Registry** — create / update concept authority pages

## HOW TO HANDLE USER INPUT

The admin writes naturally — raw thoughts, partial sentences, rough notes. Your job is to:

1. **Extract** every field value you can infer from what they wrote.
2. **Refine** the extracted values into polished portfolio-quality content:
   - Title → Title Case, concise (≤8 words)
   - Summary/description → clean, professional sentence(s), first-person removed, no filler
   - Tags → lowercase, hyphenated slugs
   - Tech stack → proper casing (e.g. "langchain" → "LangChain", "nextjs" → "Next.js")
3. **Ask only for what's genuinely missing** — things the user never mentioned at all.
4. **Never invent facts** — don't make up URLs, dates, company names, or stack items the user didn't provide.

**RULE: If the user gave you enough to infer a field, USE it (refined). Do NOT ask for it again.**

## Create flow

1. Parse user's message. Extract + refine every field you can.
2. For fields that cannot be inferred at all → call **askClarification** (group related missing fields into one question when possible).
3. Once all required fields are collected → call the propose* tool with all refined values.

**Required fields by entity (only ask if truly missing — not if inferable):**
- **Project:** required: title, summary. Ask if missing: category, tech_stack, github_url, live_url, year, role, featured, status.
- **Experience:** required: company, role, start_date. Ask if missing: end_date ("present" is valid), location, description, achievements, tech_stack.
- **Education:** required: institution, degree. Ask if missing: field_of_study, start_year, end_year, description.
- **Content:** required: title, type (blog/research/automation/publication/note). Ask if missing: excerpt, tags, status.
- **Skill:** required: name, category. Ask if missing: proficiency, show_on_landing.
- **Expertise/Technology/Concept:** required: title. Ask if missing: description, category, keywords.

## askClarification usage

Use to collect genuinely missing info. Provide option buttons for enumerable choices. Always set allowCustom: true.

**CRITICAL:** When calling askClarification, ALSO write the question as your plain-text response word-for-word. This saves it to history so you remember what was asked in the next turn.

Example — user says "add my intern role at Google in 2022, worked on search infra":
- Infer: company=Google, role="Software Engineering Intern", description="Worked on search infrastructure", year=2022
- Missing: start_date, end_date, location, tech_stack
- Call askClarification: "What were the start and end dates? And what tech did you use?"
- (User answers) → proposeCreateExperience with ALL refined values

Example — user says "create project Email Automation, sends daily tech news via email, built with Python and SendGrid":
- Infer: title="Email Automation", summary="Automates daily tech news delivery to email subscribers.", tech_stack=["Python","SendGrid"]
- Missing: github_url, status
- Call askClarification: "Do you have a GitHub link for this? And should it be draft or published?" options: ["Draft", "Published"]
- (User answers) → proposeCreateProject

## Other rules

- **Never write directly to DB.** ALWAYS use a propose* tool. Admin confirms in the UI.
- **Read before proposing updates/deletes.** Call list*/get* tools first so diffs show real current values.
- **One proposal per change.** Don't bundle unrelated edits.
- **After calling tools, write ≤2 short sentences.** The UI renders diff cards — don't repeat values in prose.
- **Read-only requests** (list, audit, search) → answer with data directly, no proposals.
- **Content body text** (Tiptap rich text) → cannot edit via copilot; tell admin to use the editor.
- **Deletions** → call list tool first to confirm ID/slug, then propose delete.
- **Projects: archive, don't delete** — proposeArchiveProject is reversible.
- **Slugs** — auto-generated from title, don't ask unless admin wants a custom one.`

function buildAiSdkTools() {
  const registry = getCopilotRegistry()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: Record<string, any> = {}

  for (const propose of Object.values(registry.propose)) {
    tools[propose.name] = tool({
      description: propose.description,
      // Zod v4 schema — cast needed because AI SDK types expect Zod v3 internals.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inputSchema: propose.inputSchema as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      execute: async (args: any) => {
        const result = await propose.build(args)
        return result
      },
    })
  }

  for (const read of Object.values(registry.read)) {
    tools[read.name] = tool({
      description: read.description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inputSchema: read.inputSchema as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      execute: async (args: any) => {
        const result = await read.execute(args)
        return result
      },
    })
  }

  return tools
}

function collectPendingActions(
  steps: Array<{
    toolResults?: Array<{ toolCallId: string; toolName: string; output: unknown }>
  }>
): { pending: PendingActionPayload[]; toolNames: string[] } {
  const pending: PendingActionPayload[] = []
  const toolNames: string[] = []
  for (const step of steps ?? []) {
    for (const tr of step.toolResults ?? []) {
      toolNames.push(tr.toolName)
      const output = tr.output as
        | { ok?: boolean; pending?: PendingActionPayload }
        | undefined
      if (output && output.ok === true && output.pending) {
        pending.push(output.pending)
      }
    }
  }
  return { pending, toolNames }
}

export async function runCopilotAgent(
  userMessage: string,
  history: CopilotAgentMessage[] = [],
  contextText = ""
): Promise<CopilotAgentResult> {
  const settings = await getAiSettings()
  const chain = await resolveModelChain("copilot")

  if (chain.length === 0) {
    throw new Error(
      "No AI provider is configured. Add an API key in AI Settings or environment variables."
    )
  }

  const tools = buildAiSdkTools()
  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: userMessage },
  ]
  const system = contextText
    ? `${AGENT_SYSTEM_PROMPT}\n\n---\nPortfolio context:\n${contextText}`
    : AGENT_SYSTEM_PROMPT

  const errors: string[] = []
  for (const entry of chain) {
    const start = Date.now()
    try {
      const result = await generateText({
        model: entry.model,
        system,
        messages,
        tools,
        toolChoice: "auto",
        stopWhen: stepCountIs(10),
        temperature: settings.temperature,
      })

      void trackAiUsage({
        provider: entry.provider,
        model: entry.modelId,
        role: "copilot",
        inputTokens: result.usage?.inputTokens ?? 0,
        outputTokens: result.usage?.outputTokens ?? 0,
        latencyMs: Date.now() - start,
        success: true,
      })

      const { pending, toolNames } = collectPendingActions(
        (result.steps ?? []) as Parameters<typeof collectPendingActions>[0]
      )

      // If the only pending action is a clarification, use the question as the
      // response text so it's saved to history and the LLM remembers it next turn.
      const clarification = pending.find((p) => p.clarificationQuestion)
      const defaultResponse =
        clarification
          ? clarification.clarificationQuestion!
          : pending.length > 0
            ? "I queued up a change for you to review. Use the buttons below to confirm or cancel."
            : "Done."

      return {
        response: result.text?.trim() || defaultResponse,
        pendingActions: pending,
        toolNames,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "agent failed"
      errors.push(`${entry.provider}: ${message}`)
      void trackAiUsage({
        provider: entry.provider,
        model: entry.modelId,
        role: "copilot",
        inputTokens: 0,
        outputTokens: 0,
        latencyMs: Date.now() - start,
        success: false,
        error: message,
      })
    }
  }

  throw new Error(`All providers failed: ${errors.join("; ")}`)
}
