"use client"

/** Run non-critical work after the browser is idle (or after a timeout fallback). */
export function deferIdleTask(task: () => void, timeoutMs = 4_000): () => void {
  if (typeof window === "undefined") {
    return () => {}
  }

  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(task, { timeout: timeoutMs })
    return () => window.cancelIdleCallback(id)
  }

  const id = globalThis.setTimeout(task, Math.min(timeoutMs, 2_000))
  return () => globalThis.clearTimeout(id)
}

const MOBILE_MEDIA_QUERY = "(max-width: 767px)"

export function isMobileViewport(): boolean {
  if (typeof window === "undefined") {
    return true
  }

  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}
