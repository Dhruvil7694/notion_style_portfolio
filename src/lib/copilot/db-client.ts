import type { SupabaseClient } from "@supabase/supabase-js"

import type { ChatMessageRow, ChatSessionRow } from "@/types/copilot"
import type { Database } from "@/types/database"

type CopilotDatabase = Database & {
  public: Database["public"] & {
    Tables: Database["public"]["Tables"] & {
      chat_sessions: {
        Row: ChatSessionRow
        Insert: { title?: string }
        Update: { title?: string; updated_at?: string }
        Relationships: []
      }
      chat_messages: {
        Row: ChatMessageRow
        Insert: {
          session_id: string
          role: ChatMessageRow["role"]
          content: string
          metadata?: Record<string, unknown> | null
        }
        Update: Partial<{
          content: string
          metadata: Record<string, unknown> | null
        }>
        Relationships: []
      }
    }
  }
}

export type CopilotSupabaseClient = SupabaseClient<CopilotDatabase>

export function asCopilotClient(
  client: SupabaseClient<Database>
): CopilotSupabaseClient {
  return client as unknown as CopilotSupabaseClient
}
