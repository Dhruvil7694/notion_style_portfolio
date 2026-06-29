"use client"

import type { VariantProps } from "class-variance-authority"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

type AdminBackToWebsiteButtonProps = {
  className?: string
  onNavigate?: () => void
  size?: VariantProps<typeof buttonVariants>["size"]
}

export function AdminBackToWebsiteButton({
  className,
  onNavigate,
  size = "sm",
}: AdminBackToWebsiteButtonProps) {
  return (
    <Link
      className={cn(buttonVariants({ variant: "outline", size }), className)}
      href="/"
      onClick={onNavigate}
    >
      <ArrowLeft aria-hidden />
      Back to website
    </Link>
  )
}
