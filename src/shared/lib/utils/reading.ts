export function estimateReadingTime(text: string | null | undefined): string {
  if (!text?.trim()) {
    return "1 min read"
  }

  const words = text.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))

  return `${minutes} min read`
}
