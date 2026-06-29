import type { LucideIcon } from "lucide-react"
import { ChevronRightIcon } from "lucide-react"
import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb"

export type BreadcrumbSegment =
  | {
      label: string
      href: string
      icon: LucideIcon
      current?: false
    }
  | {
      label: string
      icon: LucideIcon
      current: true
      href?: never
    }

type Breadcrumb03Props = {
  segments: readonly BreadcrumbSegment[]
}

export function Breadcrumb03({ segments }: Breadcrumb03Props) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="gap-1.5 text-sm">
        {segments.flatMap((segment, index) => {
          const Icon = segment.icon
          const item = (
            <BreadcrumbItem key={`${segment.label}-${index}`}>
              {"href" in segment && segment.href ? (
                <BreadcrumbLink
                  className="hover:text-foreground flex items-center gap-1.5 rounded-sm px-1 py-0.5"
                  render={<Link href={segment.href} />}
                >
                  <Icon className="text-muted-foreground size-3.5" />
                  {segment.label}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="flex items-center gap-1.5 rounded-sm px-1 py-0.5 font-medium">
                  <Icon className="text-foreground/80 size-3.5" />
                  {segment.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          )

          if (index < segments.length - 1) {
            return [
              item,
              <BreadcrumbSeparator
                className="text-muted-foreground/70"
                key={`separator-${index}`}
              >
                <ChevronRightIcon />
              </BreadcrumbSeparator>,
            ]
          }

          return [item]
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export default Breadcrumb03
