"use client"

import {
  Braces,
  ClipboardCheck,
  Database,
  GitBranch,
  type LucideIcon,
  Network,
  Rocket,
  Server,
  Sparkles,
  Wand2,
  Workflow,
} from "lucide-react"

import type { AiFirstKeywordIconName } from "@/features/portfolio/lib/ai-first-keyword-details"

const AI_FIRST_KEYWORD_ICONS = {
  Sparkles,
  Server,
  GitBranch,
  Wand2,
  Network,
  Database,
  Workflow,
  Braces,
  ClipboardCheck,
  Rocket,
} as const satisfies Record<AiFirstKeywordIconName, LucideIcon>

export function resolveAiFirstKeywordIcon(
  iconName: AiFirstKeywordIconName
): LucideIcon {
  return AI_FIRST_KEYWORD_ICONS[iconName]
}
