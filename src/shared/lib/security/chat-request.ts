import type { UIMessage } from "ai"
import { z } from "zod"

import { JOB_DESCRIPTION_MAX_CHARS } from "@/features/job-fit/lib/job-description"

export const CHAT_REQUEST_LIMITS = {
  maxMessages: 20,
  maxMessageChars: 4_000,
  maxJobFitMessageChars: JOB_DESCRIPTION_MAX_CHARS,
  maxQueryChars: 4_000,
  maxJobFitQueryChars: JOB_DESCRIPTION_MAX_CHARS,
  jobFitPrefix: "Analyse my job fit for this role:",
} as const

function isJobFitUserText(text: string): boolean {
  return text.trimStart().startsWith(CHAT_REQUEST_LIMITS.jobFitPrefix)
}

function maxCharsForUserText(text: string): number {
  return isJobFitUserText(text)
    ? CHAT_REQUEST_LIMITS.maxJobFitMessageChars
    : CHAT_REQUEST_LIMITS.maxMessageChars
}

const messagePartSchema = z.object({
  type: z.string(),
  text: z.string().optional(),
})

const chatMessageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(messagePartSchema).optional(),
})

const chatPostBodySchema = z.object({
  messages: z
    .array(chatMessageSchema)
    .max(CHAT_REQUEST_LIMITS.maxMessages)
    .optional(),
  query: z.string().max(CHAT_REQUEST_LIMITS.maxQueryChars).optional(),
})

export type ParsedChatPostBody = {
  messages: UIMessage[]
  queryText: string
}

function getMessageText(message: UIMessage): string {
  return (
    message.parts
      ?.filter(
        (part): part is { type: "text"; text: string } => part.type === "text"
      )
      .map((part) => part.text)
      .join("\n") ?? ""
  )
}

export function parseChatPostBody(
  body: unknown
): { ok: true; data: ParsedChatPostBody } | { ok: false; error: string } {
  const parsed = chatPostBodySchema.safeParse(body)
  if (!parsed.success) {
    return { ok: false, error: "Invalid request." }
  }

  const messages = (parsed.data.messages ?? []) as UIMessage[]

  for (const message of messages) {
    const text = getMessageText(message)
    const maxChars =
      message.role === "user"
        ? maxCharsForUserText(text)
        : CHAT_REQUEST_LIMITS.maxMessageChars
    if (text.length > maxChars) {
      return { ok: false, error: "Message is too long." }
    }
  }

  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user")

  const queryText =
    parsed.data.query ??
    (lastUserMessage ? getMessageText(lastUserMessage) : "")

  if (!queryText.trim()) {
    return { ok: false, error: "Message is required." }
  }

  const queryLimit = isJobFitUserText(queryText)
    ? CHAT_REQUEST_LIMITS.maxJobFitQueryChars
    : CHAT_REQUEST_LIMITS.maxQueryChars

  if (queryText.length > queryLimit) {
    return { ok: false, error: "Message is too long." }
  }

  return {
    ok: true,
    data: {
      messages,
      queryText,
    },
  }
}
