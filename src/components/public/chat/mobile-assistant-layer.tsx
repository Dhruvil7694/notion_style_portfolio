"use client"

import { useEffect, useRef } from "react"

import { useAssistant } from "@/components/public/chat/assistant-context"
import { AssistantPanel } from "@/components/public/chat/assistant-panel"
import { cn } from "@/lib/utils"

export function MobileAssistantLayer() {
  const { open, close } = useAssistant()
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const scrollY = window.scrollY
    const { body, documentElement } = document

    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.left = "0"
    body.style.right = "0"
    body.style.width = "100%"
    body.style.overflow = "hidden"
    documentElement.style.overflow = "hidden"

    return () => {
      body.style.position = ""
      body.style.top = ""
      body.style.left = ""
      body.style.right = ""
      body.style.width = ""
      body.style.overflow = ""
      documentElement.style.overflow = ""
      window.scrollTo({ top: scrollY, left: 0, behavior: "auto" })
    }
  }, [open])

  useEffect(() => {
    const backdrop = backdropRef.current
    if (!backdrop || !open) return

    const preventScroll = (event: TouchEvent) => {
      event.preventDefault()
    }

    backdrop.addEventListener("touchmove", preventScroll, { passive: false })
    return () => backdrop.removeEventListener("touchmove", preventScroll)
  }, [open])

  return (
    <>
      <div
        ref={backdropRef}
        aria-hidden={!open}
        className={cn(
          "public-site fixed inset-0 z-40 bg-black/45 transition-opacity duration-200 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={close}
      />
      <div
        className={cn(
          "public-site fixed inset-x-0 bottom-0 z-50 md:hidden",
          "pb-safe transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "pointer-events-none translate-y-full"
        )}
      >
        <AssistantPanel mobile />
      </div>
    </>
  )
}
