"use client"

import { AdminSaveToastProvider } from "@/features/admin/components/admin-save-toast"

type AdminProvidersProps = {
  children: React.ReactNode
}

export function AdminProviders({ children }: AdminProvidersProps) {
  return <AdminSaveToastProvider>{children}</AdminSaveToastProvider>
}
