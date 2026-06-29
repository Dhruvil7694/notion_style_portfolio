export interface LogContext {
  provider?: string
  model?: string
  route?: string
  sessionId?: string
  requestId?: string
  [key: string]: unknown
}

type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG"

function isDev(): boolean {
  return process.env.NODE_ENV === "development"
}

function formatLine(
  level: LogLevel,
  msg: string,
  context?: LogContext
): string {
  const ts = new Date().toISOString()
  const base = `[${level}] [${ts}] ${msg}`
  if (!context || Object.keys(context).length === 0) return base
  return `${base} ${JSON.stringify(context)}`
}

function sendToSentry(err: unknown, context?: LogContext): void {
  // Lazy import so this module stays isomorphic — sentry.ts is server-only
  // but logger.ts may be imported on the client too. Skip Sentry on client.
  if (typeof window !== "undefined") return
  if (!process.env.SENTRY_DSN) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { captureException } = require("./sentry") as {
      captureException: (e: unknown, ctx?: LogContext) => void
    }
    captureException(err, context)
  } catch {
    // Sentry unavailable — swallow
  }
}

export const logger = {
  error(msg: string, context?: LogContext): void {
    console.error(formatLine("ERROR", msg, context))
    sendToSentry(new Error(msg), context)
  },

  warn(msg: string, context?: LogContext): void {
    console.warn(formatLine("WARN", msg, context))
  },

  info(msg: string, context?: LogContext): void {
    console.info(formatLine("INFO", msg, context))
  },

  debug(msg: string, context?: LogContext): void {
    if (!isDev()) return
    console.debug(formatLine("DEBUG", msg, context))
  },
}
