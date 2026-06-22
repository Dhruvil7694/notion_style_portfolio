import {
  Activity,
  ArrowRightLeft,
  Bot,
  Box,
  Brain,
  Cloud,
  Code,
  Cpu,
  Database,
  FileText,
  Filter,
  Globe,
  HardDrive,
  Layers,
  Link,
  Lock,
  type LucideIcon,
  Mail,
  MessageSquare,
  Network,
  Search,
  Server,
  Settings,
  Shield,
  Sparkles,
  Terminal,
  User,
  Workflow,
  Wrench,
  Zap,
} from "lucide-react"

import type { ArchitectureNodeType } from "@/lib/diagrams/architecture-graph.schema"
import { defaultIconForNodeType } from "@/lib/diagrams/architecture-node-types"

export const LUCIDE_ICON_COMPONENTS: Record<string, LucideIcon> = {
  Activity,
  ArrowRightLeft,
  Bot,
  Box,
  Brain,
  Cloud,
  Code,
  Cpu,
  Database,
  FileText,
  Filter,
  Globe,
  HardDrive,
  Layers,
  Link,
  Lock,
  Mail,
  MessageSquare,
  Network,
  Search,
  Server,
  Settings,
  Shield,
  Sparkles,
  Terminal,
  User,
  Workflow,
  Wrench,
  Zap,
}

export const LUCIDE_ICON_NAMES = Object.keys(LUCIDE_ICON_COMPONENTS).sort()

export const LUCIDE_ICON_PICKER_DEFAULTS = [
  "User",
  "Bot",
  "Sparkles",
  "Database",
  "Server",
  "Wrench",
  "Workflow",
  "Brain",
  "Search",
  "Shield",
  "Network",
  "Cloud",
  "Cpu",
  "Layers",
  "Globe",
  "Zap",
] as const

const RECENT_ICONS_KEY = "architecture-graph-recent-icons"
const MAX_RECENT_ICONS = 8

export function resolveLucideIcon(
  iconName: string | null | undefined,
  nodeType?: ArchitectureNodeType
): LucideIcon {
  const fallbackName = nodeType ? defaultIconForNodeType(nodeType) : "Box"
  const resolvedName =
    iconName && iconName in LUCIDE_ICON_COMPONENTS ? iconName : fallbackName
  return LUCIDE_ICON_COMPONENTS[resolvedName] ?? Box
}

export function filterLucideIcons(query: string): string[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return [...LUCIDE_ICON_NAMES]
  }

  return LUCIDE_ICON_NAMES.filter((name) => name.toLowerCase().includes(normalized))
}

export function readRecentLucideIcons(): string[] {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const raw = window.localStorage.getItem(RECENT_ICONS_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (entry): entry is string =>
        typeof entry === "string" && entry in LUCIDE_ICON_COMPONENTS
    )
  } catch {
    return []
  }
}

export function rememberLucideIcon(iconName: string): void {
  if (typeof window === "undefined" || !(iconName in LUCIDE_ICON_COMPONENTS)) {
    return
  }

  const recent = readRecentLucideIcons().filter((name) => name !== iconName)
  recent.unshift(iconName)

  try {
    window.localStorage.setItem(
      RECENT_ICONS_KEY,
      JSON.stringify(recent.slice(0, MAX_RECENT_ICONS))
    )
  } catch {
    // Ignore storage failures.
  }
}
