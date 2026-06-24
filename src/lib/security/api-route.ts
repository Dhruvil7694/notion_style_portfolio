import "server-only"

import { NextResponse } from "next/server"

import {
  API_RATE_LIMITS,
  checkRateLimit,
  getClientIp,
  isDistributedRateLimitConfigured,
  rateLimitHeaders,
} from "@/lib/security/rate-limit"

type RateLimitName = keyof typeof API_RATE_LIMITS

type RateLimitSuccess = {
  ok: true
  headers: Record<string, string>
}

type RateLimitFailure = {
  ok: false
  response: NextResponse
}

export async function rateLimitRequest(
  request: Request,
  rateLimitName: RateLimitName
): Promise<RateLimitSuccess | RateLimitFailure> {
  if (
    process.env.NODE_ENV === "production" &&
    !isDistributedRateLimitConfigured()
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Service temporarily unavailable. Please try again later." },
        { status: 503 }
      ),
    }
  }

  const ip = getClientIp(request)
  const result = await checkRateLimit(ip, rateLimitName)
  const headers = rateLimitHeaders(result)

  if (!result.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: {
            ...headers,
            "Retry-After": String(result.retryAfterSeconds),
          },
        }
      ),
    }
  }

  return { ok: true, headers }
}
