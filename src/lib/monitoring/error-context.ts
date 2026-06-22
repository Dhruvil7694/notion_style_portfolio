export interface AiErrorContext {
  provider?: string
  model?: string
  latencyMs?: number
  route?: string
}

export interface RouteErrorContext {
  route: string
  method?: string
  statusCode?: number
}

export interface EnrichedError {
  originalError: unknown
  extras: Record<string, unknown>
}

export function withAiErrorContext(
  error: unknown,
  context: AiErrorContext,
): EnrichedError {
  return {
    originalError: error,
    extras: {
      provider: context.provider,
      model: context.model,
      latencyMs: context.latencyMs,
      route: context.route,
      errorType: "ai_error",
    },
  }
}

export function withRouteContext(
  error: unknown,
  context: RouteErrorContext,
): EnrichedError {
  return {
    originalError: error,
    extras: {
      route: context.route,
      method: context.method,
      statusCode: context.statusCode,
      errorType: "route_error",
    },
  }
}
