const STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "and",
  "ask",
  "for",
  "from",
  "have",
  "how",
  "into",
  "just",
  "like",
  "more",
  "that",
  "the",
  "this",
  "what",
  "when",
  "where",
  "which",
  "with",
  "your",
])

export function tokenizeInterestText(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
}

export function slugToLabel(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function shortenTitle(title: string, maxLength = 38): string {
  const trimmed = title.trim()
  if (trimmed.length <= maxLength) {
    return trimmed
  }

  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`
}

export function normalizeMatchText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, " ")
}

export function messageMatchesToken(message: string, token: string): boolean {
  const normalizedMessage = normalizeMatchText(message)
  const normalizedToken = normalizeMatchText(token)

  if (!normalizedToken) {
    return false
  }

  if (normalizedMessage.includes(normalizedToken)) {
    return true
  }

  const slugLike = normalizedToken.replace(/\s+/g, "-")
  return normalizedMessage.includes(slugLike.replace(/-/g, " "))
}

function incrementCount(
  counts: Record<string, number>,
  key: string,
  amount: number
): void {
  counts[key] = (counts[key] ?? 0) + amount
}

export function topWeightedKeys(
  counts: Record<string, number>,
  limit: number
): string[] {
  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([key]) => key)
}

export { incrementCount }
