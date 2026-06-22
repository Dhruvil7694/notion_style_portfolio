const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug)
}

export function assertValidSlug(slug: string): void {
  if (!isValidSlug(slug)) {
    throw new Error(
      `Invalid slug "${slug}". Use lowercase letters, numbers, and hyphens only.`
    )
  }
}
