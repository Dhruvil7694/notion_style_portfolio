import "server-only"

import { ChatOpenAI } from "@langchain/openai"

import { getAiSettings } from "./get-ai-settings"
import { isAnyProviderKeyConfigured, resolveProviderKey } from "./provider-keys"
import { PROVIDER_CONFIGS } from "./providers/registry"
import { resolvePrimaryModel } from "./providers/router"

export async function isAiConfigured(): Promise<boolean> {
  return isAnyProviderKeyConfigured()
}

export async function createPublicAssistantModel() {
  const entry = await resolvePrimaryModel("public")
  return entry.model
}

export async function createCopilotChatModel() {
  const settings = await getAiSettings()
  const entry = await resolvePrimaryModel("copilot")
  const config = PROVIDER_CONFIGS[entry.provider]
  const apiKey = await resolveProviderKey(entry.provider)

  if (!apiKey) {
    throw new Error(`${config.label} API key is not configured for copilot.`)
  }

  return new ChatOpenAI({
    apiKey,
    model: entry.modelId,
    temperature: settings.temperature,
    configuration: config.baseUrl ? { baseURL: config.baseUrl } : undefined,
  })
}

export async function getPublicAssistantModelId(): Promise<string> {
  const entry = await resolvePrimaryModel("public")
  return entry.modelId
}

export async function getCopilotModelId(): Promise<string> {
  const entry = await resolvePrimaryModel("copilot")
  return entry.modelId
}
