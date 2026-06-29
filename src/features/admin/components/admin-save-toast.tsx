"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Check } from "lucide-react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"
import { createPortal } from "react-dom"

import {
  SAVE_MESSAGES,
  SAVE_NOTIFICATION_MS,
} from "@/shared/lib/save-notification"

type AdminSaveToastContextValue = {
  showSaveSuccess: (message?: string) => void
  dismissSaveSuccess: () => void
}

const AdminSaveToastContext = createContext<AdminSaveToastContextValue | null>(
  null
)

export function AdminSaveToastProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [message, setMessage] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const dismissSaveSuccess = useCallback(() => {
    setMessage(null)
  }, [])

  const showSaveSuccess = useCallback(
    (text: string = SAVE_MESSAGES.changes) => {
      setMessage(text)
    },
    []
  )

  useEffect(() => {
    if (!message) {
      return undefined
    }

    const timer = setTimeout(() => setMessage(null), SAVE_NOTIFICATION_MS)
    return () => clearTimeout(timer)
  }, [message])

  return (
    <AdminSaveToastContext.Provider
      value={{ showSaveSuccess, dismissSaveSuccess }}
    >
      {children}
      {mounted
        ? createPortal(
            <AnimatePresence>
              {message ? (
                <motion.div
                  key={message}
                  animate={{ opacity: 1, y: 0 }}
                  aria-live="polite"
                  className="border-emerald-500/30 bg-background/90 fixed top-4 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-2 rounded-full border px-3.5 py-1.5 shadow-lg backdrop-blur-md"
                  exit={{ opacity: 0, y: -8 }}
                  initial={{ opacity: 0, y: -12 }}
                  role="status"
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                    <Check aria-hidden className="size-3 stroke-[2.5]" />
                  </span>
                  <p className="text-foreground text-xs font-medium whitespace-nowrap sm:text-sm">
                    {message}
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </AdminSaveToastContext.Provider>
  )
}

export function useAdminSaveToast() {
  return useContext(AdminSaveToastContext)
}
