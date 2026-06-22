import "server-only"

import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai"

import type { AssistantCitationPayload } from "./citations/citation-types"
import { getAiSettings } from "./get-ai-settings"
import { buildPublicAssistantPrompt } from "./prompts"
import type { AiProviderId } from "./providers/base"
import { resolveModelChain } from "./providers/router"
import { trackAiUsage } from "./usage/track-usage"

export type PublicAssistantStreamOptions = {
  messages: UIMessage[]
  contextText: string
  citations: AssistantCitationPayload["citations"]
  suggestions: string[]
}

type StreamSuccess = {
  result: ReturnType<typeof streamText>
  provider: AiProviderId
  modelId: string
  latencyMs: number
}

function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const safe: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (/^[\x00-\xFF]*$/.test(value)) {
      safe[key] = value
    }
  }
  return safe
}

export async function streamPublicAssistantWithFailover(
  options: Omit<PublicAssistantStreamOptions, "suggestions" | "citations"> & {
    system: string
    modelMessages: { role: "user" | "assistant"; content: string }[]
  }
): Promise<StreamSuccess> {
  const settings = await getAiSettings()
  const chain = await resolveModelChain("public")
  const errors: string[] = []

  for (const entry of chain) {
    const start = Date.now()
    try {
      const result = streamText({
        model: entry.model,
        system: options.system,
        messages: options.modelMessages,
        temperature: settings.temperature,
        maxOutputTokens: settings.max_tokens,
      })

      return {
        result,
        provider: entry.provider,
        modelId: entry.modelId,
        latencyMs: Date.now() - start,
      }
    } catch (error) {
      errors.push(
        `${entry.provider}: ${error instanceof Error ? error.message : "failed"}`
      )
    }
  }

  throw new Error(
    errors.length > 0
      ? "All AI providers failed. Please try again shortly."
      : "No AI provider is configured."
  )
}

export async function createPublicAssistantStreamResponse(
  options: PublicAssistantStreamOptions,
  headers: Record<string, string> = {}
) {
  const system = buildPublicAssistantPrompt(options.contextText)

  const modelMessages = options.messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.parts
        .filter((part): part is { type: "text"; text: string } => part.type === "text")
        .map((part) => part.text)
        .join("\n"),
    }))
    .filter((message) => message.content.trim().length > 0)

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const { result, provider, modelId, latencyMs } =
        await streamPublicAssistantWithFailover({
          messages: options.messages,
          contextText: options.contextText,
          system,
          modelMessages,
        })

      writer.merge(result.toUIMessageStream())

      // write citations after text so they appear below the response
      writer.write({
        type: "data-citations",
        id: "citations",
        data: {
          citations: options.citations,
          suggestions: options.suggestions,
        } satisfies AssistantCitationPayload,
      })

      void result.usage.then((usage) => {
        void trackAiUsage({
          provider,
          model: modelId,
          role: "public",
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          latencyMs,
          success: true,
        })
      })
    },
  })

  return createUIMessageStreamResponse({
    stream,
    headers: sanitizeHeaders(headers),
  })
}
