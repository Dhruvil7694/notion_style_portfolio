"use client"

import { useEffect, useState } from "react"

import {
  buildVisitorInterest,
  readVisitorProfile,
  subscribeVisitorInterest,
  type VisitorInterest,
} from "@/features/personalization/lib/visitor-interest"

export function useVisitorInterest(): VisitorInterest | null {
  const [interest, setInterest] = useState<VisitorInterest | null>(null)

  useEffect(() => {
    function refresh() {
      setInterest(buildVisitorInterest(readVisitorProfile()))
    }

    refresh()
    return subscribeVisitorInterest(refresh)
  }, [])

  return interest
}
