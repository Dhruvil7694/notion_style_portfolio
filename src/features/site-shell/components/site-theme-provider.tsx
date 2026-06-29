"use client"

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react"

import {
  persistSiteTheme,
  readSiteThemeFromDocument,
  SITE_THEME_DEFAULT,
  type SiteTheme,
  subscribeSiteTheme,
} from "@/features/portfolio/lib/site-theme"

type SiteThemeContextValue = {
  theme: SiteTheme
  setTheme: (theme: SiteTheme) => void
  toggleTheme: () => void
}

const SiteThemeContext = createContext<SiteThemeContextValue | null>(null)

type SiteThemeProviderProps = {
  children: ReactNode
}

export function SiteThemeProvider({ children }: SiteThemeProviderProps) {
  const theme = useSyncExternalStore(
    subscribeSiteTheme,
    readSiteThemeFromDocument,
    () => SITE_THEME_DEFAULT
  )

  const setTheme = useCallback((nextTheme: SiteTheme) => {
    persistSiteTheme(nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    const current = readSiteThemeFromDocument()
    persistSiteTheme(current === "light" ? "dark" : "light")
  }, [])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme]
  )

  return (
    <SiteThemeContext.Provider value={value}>
      {children}
    </SiteThemeContext.Provider>
  )
}

export function useSiteTheme() {
  const context = useContext(SiteThemeContext)

  if (!context) {
    throw new Error("useSiteTheme must be used within SiteThemeProvider")
  }

  return context
}
