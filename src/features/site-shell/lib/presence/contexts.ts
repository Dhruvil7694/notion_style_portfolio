import type {
  ContactInfo,
  SiteSettings,
} from "@/features/portfolio/lib/settings"
import {
  getISTDay,
  getISTHour,
  getISTMinute,
} from "@/features/portfolio/lib/workspace-utils"

import type { WorkspaceContext, WorkspaceState } from "./types"

export type WorkspaceContextInput = {
  site: Pick<
    SiteSettings,
    | "current_project"
    | "currently_building"
    | "currently_reading"
    | "next_project"
    | "custom_status"
    | "status_enabled"
    | "status_bubble"
  >
  contact?: Pick<ContactInfo, "location">
  now?: Date
}

export function buildWorkspaceContext(
  input: WorkspaceContextInput
): WorkspaceContext {
  const now = input.now ?? new Date()

  return {
    now,
    day: getISTDay(now),
    hour: getISTHour(now),
    minute: getISTMinute(now),
    currentProject: trimOrUndefined(input.site.current_project),
    currentlyBuilding: trimOrUndefined(input.site.currently_building),
    currentlyReading: trimOrUndefined(input.site.currently_reading),
    nextFocus: trimOrUndefined(input.site.next_project),
    customStatus: trimOrUndefined(
      input.site.custom_status ?? input.site.status_bubble
    ),
    statusEnabled: input.site.status_enabled ?? true,
    location: trimOrUndefined(input.contact?.location),
  }
}

function trimOrUndefined(value?: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function isWeekend(day: number): boolean {
  return day === 0 || day === 6
}

export function isSleepingHour(hour: number): boolean {
  return hour >= 0 && hour < 6
}

export function resolveWorkState(hour: number): WorkspaceState {
  if (hour >= 0 && hour < 6) return "sleeping"
  if (hour >= 6 && hour < 9) return "planning"
  if (hour >= 9 && hour < 12) return "deep_work"
  if (hour >= 12 && hour < 14) return "researching"
  if (hour >= 14 && hour < 18) return "building"
  if (hour >= 18 && hour < 22) return "shipping"
  return "learning"
}

export function getPresenceState(context: WorkspaceContext): WorkspaceState {
  if (isWeekend(context.day)) {
    return "weekend"
  }

  if (isSleepingHour(context.hour)) {
    return "sleeping"
  }

  return resolveWorkState(context.hour)
}
