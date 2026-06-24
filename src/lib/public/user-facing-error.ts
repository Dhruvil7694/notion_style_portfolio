export type UserFacingErrorDisplay = {
  title: string
  message: string
  canRetry: boolean
}

function readErrorText(error: unknown): string {
  if (error instanceof Error) {
    const withData = error as Error & { data?: unknown; responseBody?: string }
    if (typeof withData.responseBody === "string" && withData.responseBody) {
      try {
        const parsed = JSON.parse(withData.responseBody) as { error?: string }
        if (parsed.error) return parsed.error
      } catch {
        return withData.responseBody
      }
    }
    if (typeof withData.data === "object" && withData.data !== null) {
      const data = withData.data as { error?: string }
      if (data.error) return data.error
    }
    return error.message
  }
  if (typeof error === "string") return error
  return ""
}

export function formatUserFacingError(error: unknown): UserFacingErrorDisplay {
  const text = readErrorText(error).toLowerCase()

  if (
    text.includes("too many requests") ||
    text.includes("429") ||
    text.includes("rate limit")
  ) {
    return {
      title: "Too many requests",
      message: "Please wait a minute and try again.",
      canRetry: true,
    }
  }

  if (
    text.includes("temporarily unavailable") ||
    text.includes("service unavailable") ||
    text.includes("503")
  ) {
    return {
      title: "Service unavailable",
      message:
        "This feature is temporarily offline. Try again in a few minutes.",
      canRetry: true,
    }
  }

  if (
    text.includes("not configured") ||
    text.includes("add an ai provider") ||
    text.includes("no ai provider")
  ) {
    return {
      title: "Not configured",
      message:
        "AI isn't set up yet. Check provider settings or try again later.",
      canRetry: false,
    }
  }

  if (text.includes("message is too long") || text.includes("too long")) {
    return {
      title: "Content too long",
      message: "Shorten the input and try again.",
      canRetry: true,
    }
  }

  if (
    text.includes("all ai providers failed") ||
    text.includes("providers failed") ||
    text.includes("copilot request failed") ||
    text.includes("action failed")
  ) {
    return {
      title: "Couldn't complete the request",
      message: "The AI service hit a snag. Wait a moment and try again.",
      canRetry: true,
    }
  }

  if (
    text.includes("failed to fetch") ||
    text.includes("network") ||
    text.includes("load failed") ||
    text.includes("disconnected")
  ) {
    return {
      title: "Connection problem",
      message: "Check your internet connection and try again.",
      canRetry: true,
    }
  }

  if (
    text.includes("search") &&
    (text.includes("unavailable") || text.includes("couldn't load"))
  ) {
    return {
      title: "Search unavailable",
      message: "The search index couldn't load. Refresh the page to retry.",
      canRetry: true,
    }
  }

  if (text.includes("invalid request") || text.includes("400")) {
    return {
      title: "Couldn't process that request",
      message: "Something was wrong with the request. Try again.",
      canRetry: true,
    }
  }

  return {
    title: "Something went wrong",
    message: "An unexpected error occurred. Try again or return home.",
    canRetry: true,
  }
}

export async function readResponseErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string }
    return data.error ?? fallback
  } catch {
    return fallback
  }
}
