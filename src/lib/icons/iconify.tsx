import { Icon } from "@iconify/react"
import type { ReactNode } from "react"

export const DEFAULT_PROJECT_ICON = "lucide:file-text"

const ICONIFY_ID_PATTERN = /^[a-z0-9][a-z0-9-]*:[a-z0-9][a-z0-9._-]*$/i

export function isValidIconifyId(iconName: string | null | undefined): boolean {
  if (!iconName) {
    return false
  }

  return ICONIFY_ID_PATTERN.test(iconName)
}

export function resolveProjectIconName(iconName: string | null | undefined): string {
  return isValidIconifyId(iconName) ? iconName! : DEFAULT_PROJECT_ICON
}

export function formatIconLabel(iconName: string): string {
  const [, rawName = iconName] = iconName.split(":")
  return rawName
    .split(/[-._]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

type ProjectIconProps = {
  iconName: string | null | undefined
  className?: string
}

export function ProjectIcon({ iconName, className }: ProjectIconProps) {
  return (
    <Icon
      aria-hidden
      className={className}
      icon={resolveProjectIconName(iconName)}
    />
  )
}

export function renderProjectIcon(
  iconName: string | null | undefined,
  className?: string
): ReactNode {
  return <ProjectIcon className={className} iconName={iconName} />
}
