import { z } from "zod"

export const aiProviderIdSchema = z.enum([
  "openai",
  "anthropic",
  "gemini",
  "groq",
  "openrouter",
  "nvidia",
])

export const contextBudgetSchema = z.object({
  projects: z.number().min(0).max(100).default(40),
  research: z.number().min(0).max(100).default(25),
  concepts: z.number().min(0).max(100).default(20),
  technologies: z.number().min(0).max(100).default(10),
  expertise: z.number().min(0).max(100).default(5),
})

export const aiSettingsSchema = z.object({
  public_provider: aiProviderIdSchema.default("openai"),
  public_model: z.string().default("gpt-4o-mini"),
  copilot_provider: aiProviderIdSchema.default("openai"),
  copilot_model: z.string().default("gpt-4o"),
  fallback_provider: aiProviderIdSchema.default("openai"),
  fallback_model: z.string().default("gpt-4o-mini"),
  temperature: z.number().min(0).max(2).default(0.3),
  max_tokens: z.number().min(256).max(128_000).default(4096),
  streaming_enabled: z.boolean().default(true),
  context_budget: contextBudgetSchema.default({
    projects: 40,
    research: 25,
    concepts: 20,
    technologies: 10,
    expertise: 5,
  }),
  assistant_welcome_text: z
    .string()
    .default("Ask about projects, expertise, technologies, or experience."),
  assistant_placeholder_text: z
    .string()
    .default("Ask about projects, expertise, or technologies…"),
})

export type AiSettings = z.infer<typeof aiSettingsSchema>
export type ContextBudget = z.infer<typeof contextBudgetSchema>

export const DEFAULT_AI_SETTINGS: AiSettings = aiSettingsSchema.parse({})

export function parseAiSettings(value: unknown): AiSettings {
  return aiSettingsSchema.parse(value ?? {})
}
