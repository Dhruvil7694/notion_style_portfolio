/** Manual types for chat_sessions / chat_messages until supabase gen types is re-run. */

export type ChatSessionRow = {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export type ChatMessageRow = {
  id: string
  session_id: string
  role: "user" | "assistant" | "system"
  content: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export type ChatSessionInsert = {
  title?: string
}

export type ChatMessageInsert = {
  session_id: string
  role: "user" | "assistant" | "system"
  content: string
  metadata?: Record<string, unknown> | null
}
