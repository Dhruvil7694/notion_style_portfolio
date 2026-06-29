"use client"

import { AdminPanel } from "@/features/admin/components/admin-panel"
import { ThemeToggle } from "@/features/site-shell/components/theme-toggle"

export function AdminAppearanceSettings() {
  return (
    <AdminPanel
      description="Admin and public site share the same theme preference."
      title="Appearance"
    >
      <ThemeToggle variant="admin-settings" />
    </AdminPanel>
  )
}
