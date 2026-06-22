"use server"

import { revalidatePath, revalidateTag } from "next/cache"

import { getAdminMutationClient } from "@/lib/admin/actions/client"
import { actionError, type ActionResult, zodFieldErrors } from "@/lib/admin/schemas"
import { type AiSettingsFormData, aiSettingsFormSchema } from "@/lib/admin/schemas/ai-settings"
import {
  AI_PROVIDER_KEYS_CACHE_TAG,
  AI_PROVIDER_KEYS_SETTING,
  encryptProviderKeyUpdates,
  getEncryptedProviderKeysUncached,
  pickProviderKeyUpdates,
} from "@/lib/ai/provider-keys"
import { parseAiSettings } from "@/lib/ai/settings"

export type UpdateAiSettingsResult = {
  message: string
  savedKeyProviders: string[]
}

export async function updateAiSettings(
  input: unknown
): Promise<ActionResult<UpdateAiSettingsResult>> {
  const parsed = aiSettingsFormSchema.safeParse(input)

  if (!parsed.success) {
    return actionError("Validation failed", zodFieldErrors(parsed.error))
  }

  const supabase = await getAdminMutationClient()
  const data: AiSettingsFormData = parsed.data

  const value = parseAiSettings({
    public_provider: data.public_provider,
    public_model: data.public_model,
    copilot_provider: data.copilot_provider,
    copilot_model: data.copilot_model,
    fallback_provider: data.fallback_provider,
    fallback_model: data.fallback_model,
    temperature: data.temperature,
    max_tokens: data.max_tokens,
    streaming_enabled: data.streaming_enabled,
    context_budget: {
      projects: data.context_budget_projects,
      research: data.context_budget_research,
      concepts: data.context_budget_concepts,
      technologies: data.context_budget_technologies,
      expertise: data.context_budget_expertise,
    },
    assistant_welcome_text: data.assistant_welcome_text,
    assistant_placeholder_text: data.assistant_placeholder_text,
  })

  const { error } = await supabase.from("settings").upsert(
    { key: "ai_settings", value },
    { onConflict: "key" }
  )

  if (error) {
    return actionError(error.message)
  }

  const keyUpdates = pickProviderKeyUpdates({
    openai: data.api_key_openai,
    anthropic: data.api_key_anthropic,
    gemini: data.api_key_gemini,
    groq: data.api_key_groq,
    openrouter: data.api_key_openrouter,
    nvidia: data.api_key_nvidia,
  })

  const savedKeyProviders = Object.keys(keyUpdates)

  if (savedKeyProviders.length > 0) {
    try {
      const existing = await getEncryptedProviderKeysUncached()
      const encryptedUpdates = encryptProviderKeyUpdates(keyUpdates)
      const mergedKeys = { ...existing, ...encryptedUpdates }

      const { error: keysError } = await supabase.from("settings").upsert(
        { key: AI_PROVIDER_KEYS_SETTING, value: mergedKeys },
        { onConflict: "key" }
      )

      if (keysError) {
        return actionError(keysError.message)
      }

      revalidateTag(AI_PROVIDER_KEYS_CACHE_TAG)
    } catch (error) {
      return actionError(
        error instanceof Error ? error.message : "Failed to encrypt and store provider API keys."
      )
    }
  }

  revalidatePath("/admin/ai-settings")
  revalidateTag("ai-settings")

  const message =
    savedKeyProviders.length > 0
      ? `AI settings saved. ${savedKeyProviders.length} provider key${savedKeyProviders.length === 1 ? "" : "s"} encrypted and ready to use.`
      : "AI settings saved successfully."

  return {
    success: true,
    data: {
      message,
      savedKeyProviders,
    },
  }
}
