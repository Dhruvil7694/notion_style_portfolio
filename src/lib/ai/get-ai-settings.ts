import "server-only"

import { unstable_cache } from "next/cache"

import { createPublicReadClient } from "@/lib/supabase/public-read"

import { isAnyProviderKeyConfigured } from "./provider-keys"
import { type AiSettings,DEFAULT_AI_SETTINGS, parseAiSettings } from "./settings"

const AI_SETTINGS_CACHE_TAG = "ai-settings"

export async function getAiSettingsUncached(): Promise<AiSettings> {
  const supabase = createPublicReadClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "ai_settings")
    .maybeSingle()

  if (!data?.value) {
    return DEFAULT_AI_SETTINGS
  }

  return parseAiSettings(data.value)
}

export const getAiSettings = unstable_cache(
  getAiSettingsUncached,
  ["ai-settings"],
  { revalidate: 300, tags: [AI_SETTINGS_CACHE_TAG] }
)

export async function isAnyAiProviderConfigured(): Promise<boolean> {
  return isAnyProviderKeyConfigured()
}
