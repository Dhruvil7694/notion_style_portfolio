import { z } from "zod"

import {
  aiProviderIdSchema,
  aiSettingsSchema,
} from "@/features/ai/lib/settings"

const optionalApiKeySchema = z.string().optional()

export const aiSettingsFormSchema = z.object({
  public_provider: aiProviderIdSchema,
  public_model: z.string().trim().min(1),
  copilot_provider: aiProviderIdSchema,
  copilot_model: z.string().trim().min(1),
  fallback_provider: aiProviderIdSchema,
  fallback_model: z.string().trim().min(1),
  visibility_provider: aiProviderIdSchema,
  visibility_model: z.string().trim().min(1),
  temperature: z.coerce.number().min(0).max(2),
  max_tokens: z.coerce.number().min(256).max(128_000),
  streaming_enabled: z.boolean(),
  context_budget_projects: z.coerce.number().min(0).max(100),
  context_budget_research: z.coerce.number().min(0).max(100),
  context_budget_concepts: z.coerce.number().min(0).max(100),
  context_budget_technologies: z.coerce.number().min(0).max(100),
  context_budget_expertise: z.coerce.number().min(0).max(100),
  assistant_welcome_text: z.string().trim().min(1),
  assistant_placeholder_text: z.string().trim().min(1),
  api_key_openai: optionalApiKeySchema,
  api_key_anthropic: optionalApiKeySchema,
  api_key_gemini: optionalApiKeySchema,
  api_key_groq: optionalApiKeySchema,
  api_key_openrouter: optionalApiKeySchema,
  api_key_nvidia: optionalApiKeySchema,
})

export type AiSettingsFormValues = z.input<typeof aiSettingsFormSchema>
export type AiSettingsFormData = z.output<typeof aiSettingsFormSchema>

export function toAiSettingsFormValues(
  settings: z.infer<typeof aiSettingsSchema>
): AiSettingsFormValues {
  return {
    public_provider: settings.public_provider,
    public_model: settings.public_model,
    copilot_provider: settings.copilot_provider,
    copilot_model: settings.copilot_model,
    fallback_provider: settings.fallback_provider,
    fallback_model: settings.fallback_model,
    visibility_provider: settings.visibility_provider,
    visibility_model: settings.visibility_model,
    temperature: settings.temperature,
    max_tokens: settings.max_tokens,
    streaming_enabled: settings.streaming_enabled,
    context_budget_projects: settings.context_budget.projects,
    context_budget_research: settings.context_budget.research,
    context_budget_concepts: settings.context_budget.concepts,
    context_budget_technologies: settings.context_budget.technologies,
    context_budget_expertise: settings.context_budget.expertise,
    assistant_welcome_text: settings.assistant_welcome_text,
    assistant_placeholder_text: settings.assistant_placeholder_text,
    api_key_openai: "",
    api_key_anthropic: "",
    api_key_gemini: "",
    api_key_groq: "",
    api_key_openrouter: "",
    api_key_nvidia: "",
  }
}
