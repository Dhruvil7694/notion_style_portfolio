"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { deferIdleTask } from "@/lib/client/defer-idle"
import type { DiscoveryDocument } from "@/lib/discovery/types"
import { recordContentViewByPath } from "@/lib/public/visitor-interest"

export function VisitorInterestTracker() {
  const pathname = usePathname()
  const documentsRef = useRef<DiscoveryDocument[]>([])
  const lastTrackedPathRef = useRef<string | null>(null)
  const [documentsReady, setDocumentsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const cancelDeferred = deferIdleTask(() => {
      fetch("/api/discovery")
        .then((response) => response.json())
        .then((data: { documents?: DiscoveryDocument[] }) => {
          if (cancelled) {
            return
          }

          documentsRef.current = Array.isArray(data.documents)
            ? data.documents
            : []
          setDocumentsReady(true)
        })
        .catch(() => {})
    }, 4_000)

    return () => {
      cancelled = true
      cancelDeferred()
    }
  }, [])

  useEffect(() => {
    if (
      !documentsReady ||
      !pathname ||
      pathname === lastTrackedPathRef.current
    ) {
      return
    }

    lastTrackedPathRef.current = pathname
    recordContentViewByPath(pathname, documentsRef.current)
  }, [documentsReady, pathname])

  return null
}
