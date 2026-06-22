import type { AiProviderId, ModelConfig, ProviderConfig } from "./base"

export const PROVIDER_CONFIGS: Record<AiProviderId, ProviderConfig> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    envKey: "OPENAI_API_KEY",
    defaultModels: {
      fast: "gpt-4o-mini",
      balanced: "gpt-4o",
      strong: "gpt-4o",
    },
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    envKey: "ANTHROPIC_API_KEY",
    defaultModels: {
      fast: "claude-3-5-haiku-latest",
      balanced: "claude-sonnet-4-20250514",
      strong: "claude-sonnet-4-20250514",
    },
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    envKey: "GOOGLE_GENERATIVE_AI_API_KEY",
    defaultModels: {
      fast: "gemini-2.0-flash",
      balanced: "gemini-2.0-flash",
      strong: "gemini-2.5-pro-preview-03-25",
    },
  },
  groq: {
    id: "groq",
    label: "Groq",
    envKey: "GROQ_API_KEY",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModels: {
      fast: "llama-3.3-70b-versatile",
      balanced: "llama-3.3-70b-versatile",
      strong: "llama-3.3-70b-versatile",
    },
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    envKey: "OPENROUTER_API_KEY",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModels: {
      fast: "openai/gpt-4o-mini",
      balanced: "anthropic/claude-3.5-sonnet",
      strong: "anthropic/claude-3.5-sonnet",
    },
  },
  nvidia: {
    id: "nvidia",
    label: "NVIDIA NIM",
    envKey: "NVIDIA_API_KEY",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    defaultModels: {
      fast: "meta/llama-3.1-8b-instruct",
      balanced: "meta/llama-3.1-70b-instruct",
      strong: "meta/llama-3.1-70b-instruct",
    },
  },
}

export const MODEL_REGISTRY: ModelConfig[] = [
  {
    id: "gpt-4o-mini",
    provider: "openai",
    label: "GPT-4o Mini",
    tier: "fast",
    capabilities: {
      contextWindow: 128_000,
      supportsStreaming: true,
      supportsToolCalling: true,
      supportsJsonMode: true,
      supportsVision: true,
      costPer1kInput: 0.00015,
      costPer1kOutput: 0.0006,
    },
  },
  {
    id: "gpt-4o",
    provider: "openai",
    label: "GPT-4o",
    tier: "strong",
    capabilities: {
      contextWindow: 128_000,
      supportsStreaming: true,
      supportsToolCalling: true,
      supportsJsonMode: true,
      supportsVision: true,
      costPer1kInput: 0.0025,
      costPer1kOutput: 0.01,
    },
  },
  {
    id: "claude-3-5-haiku-latest",
    provider: "anthropic",
    label: "Claude 3.5 Haiku",
    tier: "fast",
    capabilities: {
      contextWindow: 200_000,
      supportsStreaming: true,
      supportsToolCalling: true,
      supportsJsonMode: false,
      supportsVision: true,
      costPer1kInput: 0.0008,
      costPer1kOutput: 0.004,
    },
  },
  {
    id: "claude-sonnet-4-20250514",
    provider: "anthropic",
    label: "Claude Sonnet 4",
    tier: "strong",
    capabilities: {
      contextWindow: 200_000,
      supportsStreaming: true,
      supportsToolCalling: true,
      supportsJsonMode: false,
      supportsVision: true,
      costPer1kInput: 0.003,
      costPer1kOutput: 0.015,
    },
  },
  {
    id: "gemini-2.0-flash",
    provider: "gemini",
    label: "Gemini 2.0 Flash",
    tier: "fast",
    capabilities: {
      contextWindow: 1_000_000,
      supportsStreaming: true,
      supportsToolCalling: true,
      supportsJsonMode: true,
      supportsVision: true,
      costPer1kInput: 0.0001,
      costPer1kOutput: 0.0004,
    },
  },
  {
    id: "gemini-2.5-pro-preview-03-25",
    provider: "gemini",
    label: "Gemini 2.5 Pro",
    tier: "strong",
    capabilities: {
      contextWindow: 1_000_000,
      supportsStreaming: true,
      supportsToolCalling: true,
      supportsJsonMode: true,
      supportsVision: true,
      costPer1kInput: 0.00125,
      costPer1kOutput: 0.01,
    },
  },
  {
    id: "llama-3.3-70b-versatile",
    provider: "groq",
    label: "Llama 3.3 70B",
    tier: "fast",
    capabilities: {
      contextWindow: 128_000,
      supportsStreaming: true,
      supportsToolCalling: true,
      supportsJsonMode: false,
      supportsVision: false,
      costPer1kInput: 0.00059,
      costPer1kOutput: 0.00079,
    },
  },
  {
    id: "openai/gpt-4o-mini",
    provider: "openrouter",
    label: "OpenRouter GPT-4o Mini",
    tier: "fast",
    capabilities: {
      contextWindow: 128_000,
      supportsStreaming: true,
      supportsToolCalling: true,
      supportsJsonMode: true,
      supportsVision: true,
    },
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    provider: "openrouter",
    label: "OpenRouter Claude 3.5 Sonnet",
    tier: "strong",
    capabilities: {
      contextWindow: 200_000,
      supportsStreaming: true,
      supportsToolCalling: true,
      supportsJsonMode: false,
      supportsVision: true,
    },
  },
  {
    id: "meta/llama-3.1-70b-instruct",
    provider: "nvidia",
    label: "NVIDIA Llama 3.1 70B",
    tier: "balanced",
    capabilities: {
      contextWindow: 128_000,
      supportsStreaming: true,
      supportsToolCalling: false,
      supportsJsonMode: false,
      supportsVision: false,
    },
  },
]

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODEL_REGISTRY.find((model) => model.id === modelId)
}

export function getModelsForProvider(provider: AiProviderId): ModelConfig[] {
  return MODEL_REGISTRY.filter((model) => model.provider === provider)
}

export function getProviderEnvKey(provider: AiProviderId): string {
  return PROVIDER_CONFIGS[provider].envKey
}

/** @deprecated Use resolveProviderKey() from provider-keys instead. */
export function getProviderApiKey(provider: AiProviderId): string | undefined {
  const envKey = getProviderEnvKey(provider)
  return process.env[envKey]?.trim() || undefined
}

/** @deprecated Use isProviderKeyConfigured() from provider-keys instead. */
export function isProviderConfigured(provider: AiProviderId): boolean {
  return Boolean(getProviderApiKey(provider))
}
