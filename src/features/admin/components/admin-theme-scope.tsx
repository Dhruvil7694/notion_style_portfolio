"use client"

import { useEffect } from "react"

type AdminThemeScopeProps = {
  children: React.ReactNode
}

const SCRIPT = `document.documentElement.dataset.adminTheme="true"`

/** Marks the document while admin routes are mounted — drives admin-only dark tokens. */
export function AdminThemeScope({ children }: AdminThemeScopeProps) {
  useEffect(() => {
    document.documentElement.dataset.adminTheme = "true"
    return () => {
      delete document.documentElement.dataset.adminTheme
    }
  }, [])

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
      {children}
    </>
  )
}
