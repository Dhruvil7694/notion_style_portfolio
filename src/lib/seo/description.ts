export function truncateDescription(text: string, maxLength = 160): string {
  const normalized = text.trim().replace(/\s+/g, " ")

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}
