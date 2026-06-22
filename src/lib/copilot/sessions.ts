import "server-only"

import { getAdminMutationClient } from "@/lib/admin/actions/client"
import { asCopilotClient } from "@/lib/copilot/db-client"
import type { ChatMessageRow, ChatSessionRow } from "@/types/copilot"

export type ChatSession = ChatSessionRow

export type ChatMessage = ChatMessageRow

async function getCopilotDb() {
  return asCopilotClient(await getAdminMutationClient())
}

export async function createChatSession(title = "New conversation"): Promise<ChatSession> {
  const supabase = await getCopilotDb()

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ title })
    .select("id, title, created_at, updated_at")
    .single()

  if (error) throw new Error(`Failed to create session: ${error.message}`)
  return data
}

export async function listChatSessions(limit = 20): Promise<ChatSession[]> {
  const supabase = await getCopilotDb()

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, title, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to list sessions: ${error.message}`)
  return data ?? []
}

export async function getChatSession(sessionId: string): Promise<ChatSession | null> {
  const supabase = await getCopilotDb()

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, title, created_at, updated_at")
    .eq("id", sessionId)
    .maybeSingle()

  if (error) throw new Error(`Failed to get session: ${error.message}`)
  return data
}

export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const supabase = await getCopilotDb()

  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, session_id, role, content, metadata, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })

  if (error) throw new Error(`Failed to get messages: ${error.message}`)
  return data ?? []
}

export async function saveChatMessage(
  sessionId: string,
  role: ChatMessage["role"],
  content: string,
  metadata?: Record<string, unknown>
): Promise<ChatMessage> {
  const supabase = await getCopilotDb()

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      role,
      content,
      metadata: metadata ?? null,
    })
    .select("id, session_id, role, content, metadata, created_at")
    .single()

  if (error) throw new Error(`Failed to save message: ${error.message}`)

  await supabase
    .from("chat_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId)

  return data
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const supabase = await getCopilotDb()
  const { error } = await supabase.from("chat_sessions").delete().eq("id", sessionId)
  if (error) throw new Error(`Failed to delete session: ${error.message}`)
}

export async function updateSessionTitle(sessionId: string, title: string): Promise<void> {
  const supabase = await getCopilotDb()
  const { error } = await supabase
    .from("chat_sessions")
    .update({ title })
    .eq("id", sessionId)
  if (error) throw new Error(`Failed to update session title: ${error.message}`)
}
