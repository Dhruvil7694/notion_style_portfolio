"use client"

import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { formatAdminTime } from "@/features/admin/lib/admin-datetime"
import { cn } from "@/shared/lib/utils"

const REFRESH_INTERVAL_MS = 30_000

type AiUsageLiveContextValue = {
  refreshGeneration: number
  lastRefreshedAt: Date | null
  isRefreshing: boolean
  refreshNow: () => void
}

const AiUsageLiveContext = createContext<AiUsageLiveContextValue | null>(null)

export function useAiUsageLive(): AiUsageLiveContextValue {
  const context = useContext(AiUsageLiveContext)
  if (!context) {
    throw new Error("useAiUsageLive must be used within AiUsageLiveShell")
  }
  return context
}

type AiUsageLiveShellProps = {
  children: React.ReactNode
}

export function AiUsageLiveShell({ children }: AiUsageLiveShellProps) {
  const router = useRouter()
  const [refreshGeneration, setRefreshGeneration] = useState(0)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshNow = useCallback(() => {
    if (document.visibilityState !== "visible") return

    setIsRefreshing(true)
    router.refresh()
    setRefreshGeneration((value) => value + 1)
    setLastRefreshedAt(new Date())

    window.setTimeout(() => setIsRefreshing(false), 600)
  }, [router])

  useEffect(() => {
    setLastRefreshedAt(new Date())

    const intervalId = window.setInterval(() => {
      refreshNow()
    }, REFRESH_INTERVAL_MS)

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refreshNow()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [refreshNow])

  const value = useMemo(
    () => ({
      refreshGeneration,
      lastRefreshedAt,
      isRefreshing,
      refreshNow,
    }),
    [refreshGeneration, lastRefreshedAt, isRefreshing, refreshNow]
  )

  return (
    <AiUsageLiveContext.Provider value={value}>
      {children}
    </AiUsageLiveContext.Provider>
  )
}

export function AiUsageLiveIndicator({ className }: { className?: string }) {
  const { lastRefreshedAt, isRefreshing } = useAiUsageLive()

  return (
    <div
      className={cn(
        "border-border bg-muted/45 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
        className
      )}
    >
      <RefreshCw
        aria-hidden
        className={cn("size-3.5", isRefreshing && "animate-spin")}
      />
      <span>
        Live
        {lastRefreshedAt
          ? ` · updated ${formatAdminTime(lastRefreshedAt)}`
          : null}
      </span>
    </div>
  )
}
