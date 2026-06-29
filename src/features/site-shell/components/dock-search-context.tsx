"use client"

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react"

import { isOpenPaletteShortcut } from "@/features/discovery/lib/shortcuts"

type DockSearchController = {
  open: () => void
  close: () => void
}

type DockSearchContextValue = {
  register: (controller: DockSearchController) => () => void
  open: () => void
}

const DockSearchContext = createContext<DockSearchContextValue | null>(null)

export function DockSearchProvider({ children }: { children: ReactNode }) {
  const controllerRef = useRef<DockSearchController | null>(null)

  const register = useCallback((controller: DockSearchController) => {
    controllerRef.current = controller

    return () => {
      if (controllerRef.current === controller) {
        controllerRef.current = null
      }
    }
  }, [])

  const open = useCallback(() => {
    controllerRef.current?.open()
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!isOpenPaletteShortcut(event)) {
        return
      }

      event.preventDefault()
      open()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  const value: DockSearchContextValue = {
    register,
    open,
  }

  return (
    <DockSearchContext.Provider value={value}>
      {children}
    </DockSearchContext.Provider>
  )
}

export function useDockSearchRegistration(
  controller: DockSearchController
): void {
  const context = useContext(DockSearchContext)

  useEffect(() => {
    if (!context) {
      return
    }

    return context.register(controller)
  }, [context, controller])
}
