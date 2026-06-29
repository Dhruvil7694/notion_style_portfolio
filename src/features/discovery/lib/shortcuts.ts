export const DISCOVERY_SHORTCUTS = {
  openSearch: {
    key: "k",
    meta: true,
    ctrl: true,
    label: "⌘K / Ctrl+K",
  },
  navigateUp: { key: "ArrowUp" },
  navigateDown: { key: "ArrowDown" },
  select: { key: "Enter" },
  close: { key: "Escape" },
  tab: { key: "Tab" },
} as const

export function isOpenPaletteShortcut(event: KeyboardEvent): boolean {
  const key = event.key.toLowerCase()
  return key === "k" && (event.metaKey || event.ctrlKey)
}

export function isCloseShortcut(event: KeyboardEvent): boolean {
  return event.key === "Escape"
}

export function formatShortcutLabel(isMac: boolean): string {
  return isMac ? "⌘K" : "Ctrl K"
}
