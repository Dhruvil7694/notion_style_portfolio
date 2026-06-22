export const DEFAULT_ICON_SUGGESTIONS = [
  "lucide:brain",
  "lucide:bot",
  "lucide:database",
  "lucide:shield",
  "lucide:server",
  "lucide:workflow",
  "lucide:sparkles",
  "lucide:cpu",
  "lucide:lock",
  "lucide:hard-drive",
  "lucide:fingerprint",
  "lucide:file-text",
  "lucide:globe",
  "lucide:layers",
  "lucide:rocket",
  "lucide:search",
  "lucide:cloud",
  "lucide:code",
  "lucide:terminal",
  "lucide:git-branch",
  "lucide:network",
  "lucide:zap",
  "lucide:eye",
  "lucide:chart-bar",
  "lucide:book-open",
  "lucide:message-square",
  "lucide:users",
  "lucide:settings",
  "lucide:puzzle",
  "lucide:microscope",
  "lucide:circuit-board",
  "lucide:blocks",
  "lucide:box",
  "lucide:monitor",
  "lucide:wifi",
  "lucide:flask-conical",
  "lucide:brain-circuit",
  "lucide:bot-message-square",
  "lucide:chart-line",
  "lucide:layout-dashboard",
  "lucide:link",
  "lucide:mail",
  "lucide:map",
  "lucide:pen-tool",
  "lucide:smartphone",
  "lucide:wrench",
  "lucide:activity",
  "lucide:atom",
] as const

export const ICON_PICKER_VISIBLE_ROWS = 3

type IconifySearchResponse = {
  icons?: string[]
}

export async function searchIconifyIcons(
  query: string,
  limit = 64
): Promise<string[]> {
  const trimmed = query.trim()
  if (!trimmed) {
    return [...DEFAULT_ICON_SUGGESTIONS]
  }

  const response = await fetch(
    `https://api.iconify.design/search?query=${encodeURIComponent(trimmed)}&limit=${limit}`
  )

  if (!response.ok) {
    throw new Error("Icon search failed")
  }

  const data = (await response.json()) as IconifySearchResponse
  return data.icons ?? []
}
