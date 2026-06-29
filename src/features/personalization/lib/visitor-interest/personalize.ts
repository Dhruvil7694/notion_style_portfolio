import {
  getAvatarHoverMessages,
  type WorkspaceContext,
} from "@/features/site-shell/lib/presence"

import {
  buildPersonalizedTemplates,
  rankAvatarHoverMessages,
} from "./rank-messages"
import type { VisitorInterest } from "./types"

export function getPersonalizedAvatarHoverMessages(
  context: WorkspaceContext,
  interest: VisitorInterest | null,
  count = 12
): string[] {
  const baseMessages = getAvatarHoverMessages(context, count)
  const personalizedTemplates = interest
    ? buildPersonalizedTemplates(interest)
    : []
  const merged = [...personalizedTemplates, ...baseMessages]
  const ranked = rankAvatarHoverMessages(merged, interest)

  return ranked.slice(0, Math.max(count, ranked.length))
}
