export const SITE_THEME_STORAGE_KEY = "site-theme"

export type SiteTheme = "light" | "dark"

export const SITE_THEME_DEFAULT: SiteTheme = "light"

export function isSiteTheme(value: string | null | undefined): value is SiteTheme {
  return value === "light" || value === "dark"
}

export function resolveSiteTheme(value: string | null | undefined): SiteTheme {
  return isSiteTheme(value) ? value : SITE_THEME_DEFAULT
}

export function applySiteTheme(theme: SiteTheme) {
  document.documentElement.dataset.siteTheme = theme
}

export function readSiteThemeFromDocument(): SiteTheme {
  if (typeof document === "undefined") {
    return SITE_THEME_DEFAULT
  }

  return resolveSiteTheme(document.documentElement.dataset.siteTheme)
}

const siteThemeListeners = new Set<() => void>()

export function subscribeSiteTheme(listener: () => void) {
  siteThemeListeners.add(listener)
  return () => {
    siteThemeListeners.delete(listener)
  }
}

export function notifySiteThemeChange() {
  siteThemeListeners.forEach((listener) => {
    listener()
  })
}

export function persistSiteTheme(theme: SiteTheme) {
  applySiteTheme(theme)

  try {
    localStorage.setItem(SITE_THEME_STORAGE_KEY, theme)
  } catch {
    // Ignore storage failures (private browsing, quota, etc.)
  }

  notifySiteThemeChange()
}
