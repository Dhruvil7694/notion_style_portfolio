export const VISITOR_PROFILE_KEY = "portfolio-visitor-profile"
export const LEGACY_RECENTLY_VIEWED_KEY = "portfolio-recently-viewed"
export const VISITOR_INTEREST_EVENT = "portfolio-visitor-interest-updated"

export const MAX_RECENTLY_VIEWED = 6
export const MAX_SEARCH_QUERIES = 8
export const MAX_ASSISTANT_QUESTIONS = 5

export const DEFAULT_INTEREST_WEIGHTS = {
  intentToken: 5,
  expertise: 3,
  technology: 2,
  concept: 2,
  recentTitle: 4,
  lastSearch: 3,
  lastAssistant: 4,
} as const
