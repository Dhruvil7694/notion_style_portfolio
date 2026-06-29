import type { LanguageModel } from "ai"

export type AiProviderId =
  | "openai"
  | "anthropic"
  | "gemini"
  | "groq"
  | "openrouter"
  | "nvidia"

export type AiRole = "public" | "copilot" | "fallback" | "visibility"

export type ModelTier = "fast" | "balanced" | "strong"

export type ModelCapabilities = {
  contextWindow: number
  supportsStreaming: boolean
  supportsToolCalling: boolean
  supportsJsonMode: boolean
  supportsVision: boolean
  costPer1kInput?: number
  costPer1kOutput?: number
}

export type ModelConfig = {
  id: string
  provider: AiProviderId
  label: string
  tier: ModelTier
  capabilities: ModelCapabilities
}

export type ProviderConfig = {
  id: AiProviderId
  label: string
  envKey: string
  baseUrl?: string
  defaultModels: {
    fast: string
    balanced: string
    strong: string
  }
}

export type HealthCheckResult = {
  ok: boolean
  latencyMs?: number
  error?: string
}

export type GenerateOptions = {
  system?: string
  prompt: string
  temperature?: number
  maxTokens?: number
}

export type StreamOptions = GenerateOptions & {
  messages?: { role: "user" | "assistant"; content: string }[]
}

export interface AiProviderAdapter {
  id: AiProviderId
  isConfigured(): boolean
  healthCheck(): Promise<HealthCheckResult>
  modelList(): ModelConfig[]
  createModel(modelId: string): LanguageModel
}

export type ResolvedModel = {
  provider: AiProviderId
  modelId: string
  model: LanguageModel
}
