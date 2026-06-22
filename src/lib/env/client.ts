import { type ClientEnv, clientEnvSchema } from "./schema"

function parseClientEnv(): ClientEnv {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  })

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n")

    throw new Error(
      `Invalid client environment configuration:\n${formatted}\n\nCopy .env.example to .env.local and fill in required values.`
    )
  }

  return result.data
}

export const clientEnv: ClientEnv = parseClientEnv()
