"use client"

import { useEffect, useState } from "react"

import { formatISTClock } from "@/lib/public/workspace-utils"

type LiveClockProps = {
  location: string
  className?: string
}

export function LiveClock({ location, className }: LiveClockProps) {
  const [timeLabel, setTimeLabel] = useState<string | null>(null)

  useEffect(() => {
    function updateClock() {
      setTimeLabel(formatISTClock(new Date()))
    }

    updateClock()
    const interval = window.setInterval(updateClock, 1000)
    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className={className}>
      <p className="workspace-clock-time" suppressHydrationWarning>
        {timeLabel ?? "\u00A0"}
      </p>
      <p className="workspace-clock-location">{location}</p>
    </div>
  )
}
