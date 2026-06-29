"use client"

import { useState } from "react"

import { glassPanelClass } from "@/features/portfolio/lib/glass-panel"
import { cn } from "@/shared/lib/utils"

import { useAssistant } from "./assistant-context"
import { AssistantLottieIcon } from "./assistant-lottie-icon"

export function AssistantDockButton() {
  const { open, toggle } = useAssistant()
  const [labelVisible, setLabelVisible] = useState(false)

  const handleClick = () => {
    setLabelVisible(false)
    toggle()
  }

  return (
    <div
      className="dock-assistant-root"
      onMouseEnter={() => setLabelVisible(true)}
      onMouseLeave={() => setLabelVisible(false)}
    >
      <div
        className={cn(
          "dock-assistant",
          glassPanelClass,
          labelVisible && "dock-assistant-expanded"
        )}
      >
        <button
          aria-expanded={open}
          aria-label={
            open ? "Close portfolio assistant" : "Open portfolio assistant"
          }
          className="dock-assistant-trigger"
          onClick={handleClick}
          type="button"
        >
          <AssistantLottieIcon size="dock" />
          <span className="dock-assistant-label">Ask him</span>
        </button>
      </div>
    </div>
  )
}
