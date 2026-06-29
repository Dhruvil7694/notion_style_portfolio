"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

type AdminPageMetaContextValue = {
  title: string | null
  setTitle: (title: string | null) => void
}

const AdminPageMetaContext = createContext<AdminPageMetaContextValue | null>(
  null
)

export function AdminPageMetaProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [title, setTitle] = useState<string | null>(null)
  const value = useMemo(() => ({ title, setTitle }), [title])

  return (
    <AdminPageMetaContext.Provider value={value}>
      {children}
    </AdminPageMetaContext.Provider>
  )
}

export function useAdminPageMeta() {
  const context = useContext(AdminPageMetaContext)
  if (!context) {
    throw new Error(
      "useAdminPageMeta must be used within AdminPageMetaProvider"
    )
  }
  return context
}

/** Sets the breadcrumb/page title for the current admin view (e.g. edit form name). */
export function AdminPageMeta({ title }: { title?: string | null }) {
  const { setTitle } = useAdminPageMeta()

  useEffect(() => {
    setTitle(title ?? null)
    return () => setTitle(null)
  }, [title, setTitle])

  return null
}
