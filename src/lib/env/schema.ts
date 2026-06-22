import { z } from "zod"

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({
    error: "NEXT_PUBLIC_SUPABASE_URL must be a valid URL",
  }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required"),
  NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.url().optional(),
})

export const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  SITE_URL: z.url({ error: "SITE_URL must be a valid URL" }),
  ADMIN_EMAIL: z.email({ error: "ADMIN_EMAIL must be a valid email address" }),
  SUPABASE_SECRET_KEY: z
    .string()
    .min(1, "SUPABASE_SECRET_KEY is required"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.email().optional(),
  EMAIL_REPLY_TO_ADDRESS: z.email().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  NVIDIA_API_KEY: z.string().optional(),
  AI_KEYS_ENCRYPTION_SECRET: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  SENTRY_DSN: z.url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.url().optional(),
  POSTHOG_API_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.url().optional(),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>
