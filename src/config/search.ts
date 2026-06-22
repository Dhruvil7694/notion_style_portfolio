/**
 * Search extension point (Phase 6+).
 *
 * Intended approach:
 * - Phase 6: Postgres full-text search via Supabase RPC
 * - Phase 10: Optional Meilisearch if Postgres FTS is insufficient
 *
 * Keep search query building and result ranking in this module.
 */
export const searchConfig = {
  enabled: true,
  provider: "postgres" as "postgres" | "meilisearch",
  debounceMs: 300,
  minQueryLength: 2,
  defaultLimit: 20,
} as const

export type SearchContentType =
  | "projects"
  | "blogs"
  | "research"
  | "automation"
  | "experience"

/** Placeholder — implement searchContent in Phase 6. */
export async function searchContent(): Promise<unknown[]> {
  return []
}
