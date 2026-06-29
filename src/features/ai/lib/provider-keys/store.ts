import "server-only"

import { unstable_cache } from "next/cache"
import { z } from "zod"

import { createAdminClient } from "@/shared/lib/supabase/admin"

import type { AiProviderId } from "../providers/base"
import { decryptSecret, encryptSecret } from "./crypto"

const AI_PROVIDER_KEYS_SETTING = "ai_provider_keys"
const AI_PROVIDER_KEYS_CACHE_TAG = "ai-provider-keys"

const storedProviderKeysSchema = z.record(z.string(), z.string().min(1))

export type StoredProviderKeys = Partial<Record<AiProviderId, string>>

export async function getEncryptedProviderKeysUncached(): Promise<StoredProviderKeys> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", AI_PROVIDER_KEYS_SETTING)
    .maybeSingle()

  if (!data?.value) {
    return {}
  }

  return storedProviderKeysSchema.parse(data.value)
}

export const getEncryptedProviderKeys = unstable_cache(
  getEncryptedProviderKeysUncached,
  ["ai-provider-keys-encrypted"],
  { revalidate: 300, tags: [AI_PROVIDER_KEYS_CACHE_TAG] }
)

export async function decryptStoredProviderKeys(
  encryptedKeys: StoredProviderKeys = {}
): Promise<Partial<Record<AiProviderId, string>>> {
  const decrypted: Partial<Record<AiProviderId, string>> = {}

  for (const [provider, payload] of Object.entries(encryptedKeys) as [
    AiProviderId,
    string,
  ][]) {
    try {
      decrypted[provider] = decryptSecret(payload)
    } catch {
      // Skip corrupted entries rather than failing the whole request.
    }
  }

  return decrypted
}

export function encryptProviderKeyUpdates(
  updates: Partial<Record<AiProviderId, string>>
): StoredProviderKeys {
  const encrypted: StoredProviderKeys = {}

  for (const [provider, apiKey] of Object.entries(updates) as [
    AiProviderId,
    string,
  ][]) {
    const trimmed = apiKey.trim()
    if (trimmed) {
      encrypted[provider] = encryptSecret(trimmed)
    }
  }

  return encrypted
}

export { AI_PROVIDER_KEYS_CACHE_TAG, AI_PROVIDER_KEYS_SETTING }
