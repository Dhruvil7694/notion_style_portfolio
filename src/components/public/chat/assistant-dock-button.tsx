"use client"

import type { DotLottie } from "@lottiefiles/dotlottie-react"
import { DotLottieReact, setWasmUrl } from "@lottiefiles/dotlottie-react"
import { useEffect, useRef, useState } from "react"

import { glassPanelClass } from "@/lib/public/glass-panel"
import { cn } from "@/lib/utils"

import { useAssistant } from "./assistant-context"

setWasmUrl("/dotlottie-player.wasm")

const CHATBOT_LOTTIE_SRC = "/chatbot_logo/loading.lottie"

export function AssistantDockButton() {
  const { open, toggle } = useAssistant()
  const [labelVisible, setLabelVisible] = useState(false)
  const [devicePixelRatio, setDevicePixelRatio] = useState(2)
  const lottieRef = useRef<DotLottie | null>(null)

  useEffect(() => {
    setDevicePixelRatio(window.devicePixelRatio ?? 2)
    const dl = lottieRef.current
    if (!dl) return
    requestAnimationFrame(() => dl.resize())
  }, [])

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
      <div className={cn("dock-assistant", glassPanelClass, labelVisible && "dock-assistant-expanded")}>
        <button
          aria-expanded={open}
          aria-label={open ? "Close portfolio assistant" : "Open portfolio assistant"}
          className="dock-assistant-trigger"
          onClick={handleClick}
          type="button"
        >
          <div className="dock-assistant-lottie">
            <DotLottieReact
              autoplay
              dotLottieRefCallback={(dl) => { lottieRef.current = dl }}
              loop
              renderConfig={{ devicePixelRatio }}
              src={CHATBOT_LOTTIE_SRC}
            />
          </div>
          <span className="dock-assistant-label">Assistant</span>
        </button>
      </div>
    </div>
  )
}
