export type AiAssistantRole = "public" | "copilot"

export type AiSourceReference = {
  id: string
  type: string
  title: string
  url: string
  score?: number
}

export type AiRetrievalResult = {
  query: string
  sources: AiSourceReference[]
  contextText: string
  entityIds: string[]
}

export type AiMessageRole = "user" | "assistant" | "system"

export type AiChatMessage = {
  role: AiMessageRole
  content: string
}

export type AiStreamMetadata = {
  sources?: AiSourceReference[]
  suggestions?: string[]
}

export type CopilotIntent =
  | "audit"
  | "create_content"
  | "update_content"
  | "generate_content"
  | "relationships"
  | "search"
  | "general"

export type CopilotToolCall = {
  id: string
  name: string
  args: Record<string, unknown>
  requiresConfirmation: boolean
}

export type CopilotToolResult = {
  toolCallId: string
  name: string
  success: boolean
  data?: unknown
  error?: string
  requiresConfirmation?: boolean
  preview?: unknown
}

export type CopilotPendingAction = {
  toolCallId: string
  toolName: string
  args: Record<string, unknown>
  label: string
  description?: string
  preview?: unknown
}

export type CopilotWorkflowResult = {
  intent: CopilotIntent
  response: string
  toolCalls: CopilotToolCall[]
  toolResults: CopilotToolResult[]
  pendingConfirmation: boolean
  pendingActions: CopilotPendingAction[]
}
