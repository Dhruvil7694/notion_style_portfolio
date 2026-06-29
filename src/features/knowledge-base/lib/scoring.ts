/** Related-content scoring weights — concept overlap is highest signal */
export const RELATED_CONTENT_WEIGHTS = {
  expertise: 2,
  technology: 3,
  concept: 5,
  tag: 1,
  directGraphEdge: 4,
} as const

export function normalizeConceptSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function normalizeMatchKey(value: string): string {
  return normalizeConceptSlug(value)
}

export function scoreWeightedOverlap(
  left: string[],
  right: string[],
  weight: number
): number {
  const leftSet = new Set(left.map(normalizeMatchKey).filter(Boolean))
  let score = 0

  for (const value of right) {
    if (leftSet.has(normalizeMatchKey(value))) {
      score += weight
    }
  }

  return score
}
