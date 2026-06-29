export type WorkspaceState =
  | "sleeping"
  | "planning"
  | "deep_work"
  | "building"
  | "researching"
  | "debugging"
  | "learning"
  | "shipping"
  | "weekend"
  | "offline"

export type PresenceChannel = "bubble" | "name" | "timeblock"

export type ContextMessage = {
  text: string
  weight: number
}

export interface WorkspaceContext {
  now: Date
  day: number
  hour: number
  minute: number
  currentProject?: string
  currentlyBuilding?: string
  currentlyReading?: string
  nextFocus?: string
  customStatus?: string
  statusEnabled: boolean
  location?: string
}

export type AvatarPresence = {
  currentProject?: string
  currentlyBuilding?: string
  currentlyReading?: string
  nextFocus?: string
}

export type PresenceResult = {
  state: WorkspaceState
  message: string
  priority: PresencePriority
}

export type PresencePriority =
  | "custom"
  | "weekend"
  | "sleeping"
  | "project"
  | "building"
  | "reading"
  | "work_state"
  | "fallback"
