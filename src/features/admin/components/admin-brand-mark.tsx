"use client"

import Link from "next/link"

import { cn } from "@/shared/lib/utils"

type AdminBrandMarkProps = {
  className?: string
}

export function AdminBrandMark({ className }: AdminBrandMarkProps) {
  return (
    <Link
      className={cn(
        "hover:bg-muted/60 flex w-fit items-center gap-2.5 rounded-md px-1 py-1 transition-colors",
        className
      )}
      href="/admin"
      title="Admin dashboard"
    >
      <span aria-hidden className="admin-brand-mark-icon shrink-0" />
      <span className="text-[0.9375rem] font-semibold leading-none">Admin</span>
    </Link>
  )
}
