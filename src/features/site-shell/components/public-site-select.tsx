"use client"

import type { ComponentProps } from "react"

import { cn } from "@/shared/lib/utils"
import { SelectContent, SelectItem, SelectTrigger } from "@/shared/ui/select"

type PublicSiteSelectTriggerProps = ComponentProps<typeof SelectTrigger>

export function PublicSiteSelectTrigger({
  className,
  ...props
}: PublicSiteSelectTriggerProps) {
  return (
    <SelectTrigger
      className={cn("public-site-select-trigger", className)}
      {...props}
    />
  )
}

type PublicSiteSelectContentProps = ComponentProps<typeof SelectContent>

export function PublicSiteSelectContent({
  className,
  ...props
}: PublicSiteSelectContentProps) {
  return (
    <SelectContent
      className={cn("public-site-select-content", className)}
      {...props}
    />
  )
}

export { SelectItem }
