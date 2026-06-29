import type { EntityFormStep } from "@/features/admin/components/forms/entity-form-wizard"

export const AI_SETTINGS_FORM_STEPS: EntityFormStep[] = [
  {
    id: "keys",
    title: "API keys",
    description: "Provider credentials and configuration status.",
    fields: [
      "api_key_openai",
      "api_key_anthropic",
      "api_key_gemini",
      "api_key_groq",
      "api_key_openrouter",
      "api_key_nvidia",
    ],
  },
  {
    id: "providers",
    title: "Providers",
    description: "Public assistant, copilot, and fallback routing.",
    fields: [
      "public_provider",
      "public_model",
      "copilot_provider",
      "copilot_model",
      "fallback_provider",
      "fallback_model",
    ],
  },
  {
    id: "assistant",
    title: "Assistant",
    description: "Welcome message and input placeholder for the public chat.",
    fields: ["assistant_welcome_text", "assistant_placeholder_text"],
  },
  {
    id: "advanced",
    title: "Advanced",
    description: "Generation parameters and retrieval context budget.",
    fields: [
      "temperature",
      "max_tokens",
      "streaming_enabled",
      "context_budget_projects",
      "context_budget_research",
      "context_budget_concepts",
      "context_budget_technologies",
      "context_budget_expertise",
    ],
  },
]
