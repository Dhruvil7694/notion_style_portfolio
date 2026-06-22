import type { BaseMessage } from "@langchain/core/messages"
import { Annotation } from "@langchain/langgraph"

import type {
  CopilotIntent,
  CopilotPendingAction,
  CopilotToolCall,
  CopilotToolResult,
} from "@/lib/ai/types"

export const CopilotStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (prev, next) => prev.concat(next),
    default: () => [],
  }),
  intent: Annotation<CopilotIntent>({
    reducer: (_, next) => next,
    default: () => "general" as CopilotIntent,
  }),
  contextText: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),
  toolCalls: Annotation<CopilotToolCall[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  toolResults: Annotation<CopilotToolResult[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  pendingConfirmation: Annotation<boolean>({
    reducer: (_, next) => next,
    default: () => false,
  }),
  pendingActions: Annotation<CopilotPendingAction[]>({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  response: Annotation<string>({
    reducer: (_, next) => next,
    default: () => "",
  }),
  error: Annotation<string | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),
})

export type CopilotGraphState = typeof CopilotStateAnnotation.State
