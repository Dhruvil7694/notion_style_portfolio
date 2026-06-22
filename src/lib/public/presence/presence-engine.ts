import {
  buildWorkspaceContext,
  getPresenceState,
  isSleepingHour,
  isWeekend,
  type WorkspaceContextInput,
} from "./contexts"
import {
  pickDeterministicMessage,
  pickDeterministicMessages,
} from "./deterministic-picker"
import {
  getAvatarHoverMessagePool,
  getPresenceMessagePool,
} from "./message-pools"
import type {
  AvatarPresence,
  PresenceChannel,
  PresencePriority,
  PresenceResult,
  WorkspaceContext,
} from "./types"

function resolvePriority(context: WorkspaceContext): PresencePriority {
  if (context.statusEnabled && context.customStatus) return "custom"
  if (isWeekend(context.day)) return "weekend"
  if (isSleepingHour(context.hour)) return "sleeping"
  if (context.currentProject) return "project"
  if (context.currentlyBuilding) return "building"
  if (context.currentlyReading) return "reading"
  return "work_state"
}

export function getPresenceMessage(
  context: WorkspaceContext,
  channel: PresenceChannel = "bubble",
  salt = 0
): string {
  const pool = getPresenceMessagePool(context, channel)
  return pickDeterministicMessage(pool, context, salt)
}

export function getPresenceMessages(
  context: WorkspaceContext,
  channel: PresenceChannel = "bubble",
  count = 5
): string[] {
  const pool = getPresenceMessagePool(context, channel)
  return pickDeterministicMessages(pool, context, count)
}

export function getPresenceResult(
  context: WorkspaceContext,
  channel: PresenceChannel = "bubble"
): PresenceResult {
  return {
    state: getPresenceState(context),
    message: getPresenceMessage(context, channel),
    priority: resolvePriority(context),
  }
}

export function getAvatarPresence(context: WorkspaceContext): AvatarPresence {
  return {
    currentProject: context.currentProject,
    currentlyBuilding: context.currentlyBuilding,
    currentlyReading: context.currentlyReading,
    nextFocus: context.nextFocus,
  }
}

export function getAvatarHoverMessages(
  context: WorkspaceContext,
  count = 8
): string[] {
  const pool = getAvatarHoverMessagePool(context)
  return pickDeterministicMessages(pool, context, Math.max(pool.length, count))
}

export function getTimeBlockPresence(context: WorkspaceContext): string {
  return getPresenceMessage(context, "timeblock")
}

export function createPresenceFromSettings(input: WorkspaceContextInput) {
  const context = buildWorkspaceContext(input)

  return {
    context,
    state: getPresenceState(context),
    message: getPresenceMessage(context),
    timeBlock: getTimeBlockPresence(context),
    avatar: getAvatarPresence(context),
    nameMessages: getPresenceMessages(context, "name", 6),
  }
}

export { buildWorkspaceContext, getPresenceState, type WorkspaceContextInput } from "./contexts"
