"use client"

import type { DotLottie } from "@lottiefiles/dotlottie-react"
import { DotLottieReact, setWasmUrl } from "@lottiefiles/dotlottie-react"
import { useEffect, useRef } from "react"

import { useSiteTheme } from "@/components/public/site-theme-provider"
import { cn } from "@/lib/utils"

setWasmUrl("/dotlottie-player.wasm")

const CHATBOT_LOTTIE_SRC = "/chatbot_logo/loading.lottie"

type AssistantLottieIconProps = {
  className?: string
  size?: "dock" | "header"
}

export function AssistantLottieIcon({
  className,
  size = "dock",
}: AssistantLottieIconProps) {
  const { theme } = useSiteTheme()
  const lottieRef = useRef<DotLottie | null>(null)

  useEffect(() => {
    const dl = lottieRef.current
    if (!dl) return
    requestAnimationFrame(() => dl.resize())
  }, [size, theme])

  return (
    <div
      className={cn(
        "assistant-lottie-icon pointer-events-none",
        size === "dock" && "assistant-lottie-icon-dock",
        size === "header" && "assistant-lottie-icon-header",
        theme === "dark" && "assistant-lottie-icon-dark",
        theme === "light" && "assistant-lottie-icon-light",
        className
      )}
    >
      <DotLottieReact
        autoplay
        dotLottieRefCallback={(dl) => {
          lottieRef.current = dl
        }}
        loop
        renderConfig={{ devicePixelRatio: size === "header" ? 2 : 2 }}
        src={CHATBOT_LOTTIE_SRC}
      />
    </div>
  )
}
