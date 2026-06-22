import "server-only"

import { type ServerEnv, serverEnvSchema } from "./schema"

let cachedServerEnv: ServerEnv | undefined

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) {
    return cachedServerEnv
  }

  const result = serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    SITE_URL: process.env.SITE_URL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    NVIDIA_API_KEY: process.env.NVIDIA_API_KEY,
    AI_KEYS_ENCRYPTION_SECRET: process.env.AI_KEYS_ENCRYPTION_SECRET,
  })

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n")

    throw new Error(
      `Invalid server environment configuration:\n${formatted}\n\nCopy .env.example to .env.local and fill in required values.`
    )
  }

  cachedServerEnv = result.data
  return cachedServerEnv
}
