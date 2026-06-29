import "server-only"

import type { AiProviderId } from "../providers/base"
import { getProviderEnvKey, PROVIDER_CONFIGS } from "../providers/registry"
import { maskSecret } from "./crypto"
import {
  decryptStoredProviderKeys,
  getEncryptedProviderKeysUncached,
} from "./store"

export type ProviderKeySource = "env" | "cms" | null

export type ResolvedProviderKey = {
  configured: boolean
  source: ProviderKeySource
  apiKey?: string
  maskedKey?: string
}

const PROVIDER_IDS = Object.keys(PROVIDER_CONFIGS) as AiProviderId[]

function readEnvProviderKey(provider: AiProviderId): string | undefined {
  const envKey = getProviderEnvKey(provider)
  return process.env[envKey]?.trim() || undefined
}

export async function getDecryptedProviderKeysFromCms(): Promise<
  Partial<Record<AiProviderId, string>>
> {
  const encrypted = await getEncryptedProviderKeysUncached()
  return decryptStoredProviderKeys(encrypted)
}

export async function resolveProviderKeysMap(): Promise<
  Record<AiProviderId, string | undefined>
> {
  const cmsKeys = await getDecryptedProviderKeysFromCms()
  const resolved = {} as Record<AiProviderId, string | undefined>

  for (const provider of PROVIDER_IDS) {
    resolved[provider] = cmsKeys[provider] ?? readEnvProviderKey(provider)
  }

  return resolved
}

export async function resolveProviderKey(
  provider: AiProviderId
): Promise<string | undefined> {
  const keys = await resolveProviderKeysMap()
  return keys[provider]
}

export async function isProviderKeyConfigured(
  provider: AiProviderId
): Promise<boolean> {
  return Boolean(await resolveProviderKey(provider))
}

export async function isAnyProviderKeyConfigured(): Promise<boolean> {
  const keys = await resolveProviderKeysMap()
  return PROVIDER_IDS.some((provider) => Boolean(keys[provider]))
}

export async function getProviderKeyStatus(
  provider: AiProviderId
): Promise<ResolvedProviderKey> {
  const cmsKeys = await getDecryptedProviderKeysFromCms()
  const cmsKey = cmsKeys[provider]
  const envKey = readEnvProviderKey(provider)

  if (cmsKey) {
    return {
      configured: true,
      source: "cms",
      apiKey: cmsKey,
      maskedKey: maskSecret(cmsKey),
    }
  }

  if (envKey) {
    return {
      configured: true,
      source: "env",
      apiKey: envKey,
      maskedKey: maskSecret(envKey),
    }
  }

  return {
    configured: false,
    source: null,
  }
}

export function pickProviderKeyUpdates(
  input: Partial<Record<AiProviderId, string | undefined>>
): Partial<Record<AiProviderId, string>> {
  const updates: Partial<Record<AiProviderId, string>> = {}

  for (const provider of PROVIDER_IDS) {
    const value = input[provider]?.trim()
    if (value) {
      updates[provider] = value
    }
  }

  return updates
}
