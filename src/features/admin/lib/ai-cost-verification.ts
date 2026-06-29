export const AI_PROVIDER_DASHBOARDS: Record<string, string> = {
  openai: "https://platform.openai.com/usage",
  anthropic: "https://console.anthropic.com/settings/usage",
  openrouter: "https://openrouter.ai/activity",
  groq: "https://console.groq.com/",
  gemini:
    "https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com",
  google:
    "https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com",
  nvidia: "https://build.nvidia.com/",
}

export function providerDashboardUrl(provider: string): string | null {
  return AI_PROVIDER_DASHBOARDS[provider.toLowerCase()] ?? null
}

export function varianceLevel(pct: number): "ok" | "warn" | "error" {
  if (pct <= 10) return "ok"
  if (pct <= 25) return "warn"
  return "error"
}

export function varianceLabel(pct: number): string {
  if (pct <= 10) return "OK"
  if (pct <= 25) return "High"
  return "Alert"
}
