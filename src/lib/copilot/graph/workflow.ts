import "server-only"

import { AIMessage, HumanMessage } from "@langchain/core/messages"
import { END, START, StateGraph } from "@langchain/langgraph"

import {
  getCachedKnowledgeSummary,
  getCachedPortfolioSnapshot,
  getCachedToolSummary,
} from "@/lib/ai/cache/summaries"
import type { CopilotWorkflowResult } from "@/lib/ai/types"
import { getPublicSettings } from "@/lib/public/queries"
import { resolveSiteUrl } from "@/lib/seo/canonical"

import {
  buildContextNode,
  detectIntentNode,
  executeToolsNode,
  respondNode,
  selectToolsNode,
  validateNode,
} from "./nodes"
import { type CopilotGraphState,CopilotStateAnnotation } from "./state"

function buildCopilotWorkflow() {
  const workflow = new StateGraph(CopilotStateAnnotation)
    .addNode("detectIntent", detectIntentNode)
    .addNode("buildContext", buildContextNode)
    .addNode("selectTools", selectToolsNode)
    .addNode("executeTools", executeToolsNode)
    .addNode("validate", validateNode)
    .addNode("respond", respondNode)

  workflow.addEdge(START, "detectIntent")
  workflow.addEdge("detectIntent", "buildContext")
  workflow.addEdge("buildContext", "selectTools")
  workflow.addEdge("selectTools", "executeTools")
  workflow.addEdge("executeTools", "validate")
  workflow.addEdge("validate", "respond")
  workflow.addEdge("respond", END)

  return workflow.compile()
}

let compiledWorkflow: ReturnType<typeof buildCopilotWorkflow> | null = null

function getWorkflow() {
  if (!compiledWorkflow) {
    compiledWorkflow = buildCopilotWorkflow()
  }
  return compiledWorkflow
}

export async function runCopilotWorkflow(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<CopilotWorkflowResult> {
  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)
  let contextText = ""

  if (siteUrl) {
    const [snapshot, knowledgeSummary, toolSummary] = await Promise.all([
      getCachedPortfolioSnapshot(siteUrl),
      getCachedKnowledgeSummary(siteUrl),
      getCachedToolSummary(),
    ])
    contextText = [snapshot, knowledgeSummary, toolSummary].filter(Boolean).join("\n\n")
  }

  const messages = [
    ...history.map((msg) =>
      msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
    ),
    new HumanMessage(userMessage),
  ]

  const initialState: Partial<CopilotGraphState> = {
    messages,
    contextText,
    toolCalls: [],
    toolResults: [],
    pendingConfirmation: false,
    pendingActions: [],
  }

  const result = await getWorkflow().invoke(initialState)

  return {
    intent: result.intent,
    response: result.response,
    toolCalls: result.toolCalls,
    toolResults: result.toolResults,
    pendingConfirmation: result.pendingConfirmation,
    pendingActions: result.pendingActions,
  }
}
