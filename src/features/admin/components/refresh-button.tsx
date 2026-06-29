"use client"

import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useState, useTransition } from "react"

export function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [justRefreshed, setJustRefreshed] = useState(false)

  const handleRefresh = useCallback(() => {
    startTransition(() => {
      router.refresh()
    })
    setJustRefreshed(true)
    setTimeout(() => setJustRefreshed(false), 2000)
  }, [router])

  return (
    <button
      className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1.5 text-xs transition-colors disabled:pointer-events-none disabled:opacity-50"
      disabled={isPending}
      onClick={handleRefresh}
      type="button"
    >
      <RefreshCw className={`size-3 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Refreshing…" : justRefreshed ? "Done!" : "Refresh"}
    </button>
  )
}
