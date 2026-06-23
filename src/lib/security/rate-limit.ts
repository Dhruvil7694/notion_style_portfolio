import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

export type RateLimitResult = {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
  retryAfterSeconds: number
}

// ---------------------------------------------------------------------------
// IP extraction — trust rightmost value in x-forwarded-for to prevent spoofing
// ---------------------------------------------------------------------------

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    const parts = forwarded.split(",")
    const last = parts[parts.length - 1]?.trim()
    if (last) return last
  }

  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  )
}

// ---------------------------------------------------------------------------
// Rate limit configs
// ---------------------------------------------------------------------------

export const API_RATE_LIMITS = {
  discovery: { limit: 60, windowMs: 60_000 },
  knowledgeGraph: { limit: 30, windowMs: 60_000 },
  chat: { limit: 20, windowMs: 60_000 },
  copilot: { limit: 30, windowMs: 60_000 },
  notifyEmployer: { limit: 3, windowMs: 60_000 },
  jobFitExport: { limit: 10, windowMs: 60_000 },
} as const

type RateLimitName = keyof typeof API_RATE_LIMITS

// ---------------------------------------------------------------------------
// Upstash-backed limiters (one per named bucket)
// Created lazily once on first request; safe across serverless instances.
// ---------------------------------------------------------------------------

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  redis = new Redis({ url, token })
  return redis
}

const limiters = new Map<RateLimitName, Ratelimit>()

function getLimiter(name: RateLimitName): Ratelimit | null {
  const r = getRedis()
  if (!r) return null

  if (limiters.has(name)) return limiters.get(name)!

  const { limit, windowMs } = API_RATE_LIMITS[name]
  const limiter = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs}ms`),
    prefix: `rl:${name}`,
  })
  limiters.set(name, limiter)
  return limiter
}

// ---------------------------------------------------------------------------
// In-memory fallback for local dev (no Upstash configured)
// ---------------------------------------------------------------------------

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

function checkInMemory(key: string, name: RateLimitName): RateLimitResult {
  const { limit, windowMs } = API_RATE_LIMITS[name]
  const now = Date.now()

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    }
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(
        Math.ceil((existing.resetAt - now) / 1000),
        1
      ),
    }
  }

  existing.count += 1
  return {
    allowed: true,
    limit,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
    retryAfterSeconds: Math.max(Math.ceil((existing.resetAt - now) / 1000), 1),
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function checkRateLimit(
  ip: string,
  name: RateLimitName
): Promise<RateLimitResult> {
  const limiter = getLimiter(name)

  if (limiter) {
    const { success, limit, remaining, reset } = await limiter.limit(
      `${name}:${ip}`
    )
    const now = Date.now()
    return {
      allowed: success,
      limit,
      remaining,
      resetAt: reset,
      retryAfterSeconds: Math.max(Math.ceil((reset - now) / 1000), 1),
    }
  }

  // Fallback: in-memory (dev only — non-functional across serverless instances)
  return checkInMemory(`${name}:${ip}`, name)
}

export function rateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  }
}
