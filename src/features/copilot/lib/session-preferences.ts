export type SessionStatus = "active" | "archived"

export type SessionPreferences = {
  pinned?: boolean
  archived?: boolean
  project?: string | null
  unread?: boolean
  status?: SessionStatus
}

export type GroupByOption = "none" | "date" | "project" | "unread" | "status"

const STORAGE_KEY = "copilot-session-preferences"

export const COPILOT_PROJECTS = [
  "Portfolio",
  "Content",
  "SEO",
  "Automations",
  "General",
] as const

function readAll(): Record<string, SessionPreferences> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, SessionPreferences>
  } catch {
    return {}
  }
}

function writeAll(data: Record<string, SessionPreferences>) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getSessionPreferences(sessionId: string): SessionPreferences {
  return readAll()[sessionId] ?? {}
}

export function getAllSessionPreferences(): Record<string, SessionPreferences> {
  return readAll()
}

export function updateSessionPreferences(
  sessionId: string,
  patch: Partial<SessionPreferences>
): SessionPreferences {
  const all = readAll()
  const next = { ...(all[sessionId] ?? {}), ...patch }
  all[sessionId] = next
  writeAll(all)
  return next
}

export function removeSessionPreferences(sessionId: string) {
  const all = readAll()
  delete all[sessionId]
  writeAll(all)
}

export function isSessionArchived(prefs: SessionPreferences): boolean {
  return prefs.archived === true || prefs.status === "archived"
}

export type ChatSessionListItem = {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export function isSessionPinned(prefs: SessionPreferences): boolean {
  return prefs.pinned === true
}

export function sortSessionsByUpdated(
  sessions: ChatSessionListItem[]
): ChatSessionListItem[] {
  return [...sessions].sort(
    (a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )
}

export function splitSessionsBySection(
  sessions: ChatSessionListItem[],
  preferences: Record<string, SessionPreferences>
): {
  pinned: ChatSessionListItem[]
  recents: ChatSessionListItem[]
  archived: ChatSessionListItem[]
} {
  const pinned: ChatSessionListItem[] = []
  const recents: ChatSessionListItem[] = []
  const archived: ChatSessionListItem[] = []

  for (const session of sessions) {
    const prefs = preferences[session.id] ?? {}
    if (isSessionArchived(prefs)) {
      archived.push(session)
    } else if (isSessionPinned(prefs)) {
      pinned.push(session)
    } else {
      recents.push(session)
    }
  }

  return {
    pinned: sortSessionsByUpdated(pinned),
    recents: sortSessionsByUpdated(recents),
    archived: sortSessionsByUpdated(archived),
  }
}

export type SessionGroup = {
  label: string
  sessions: ChatSessionListItem[]
}

function sortSessions(
  sessions: ChatSessionListItem[],
  preferences: Record<string, SessionPreferences>
): ChatSessionListItem[] {
  return [...sessions].sort((a, b) => {
    const aPinned = preferences[a.id]?.pinned ? 1 : 0
    const bPinned = preferences[b.id]?.pinned ? 1 : 0
    if (aPinned !== bPinned) return bPinned - aPinned
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })
}

function dateGroupLabel(dateIso: string): string {
  const date = new Date(dateIso)
  const now = new Date()
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  )
  const startOfDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  )
  const diffDays = Math.floor(
    (startOfToday.getTime() - startOfDate.getTime()) / 86_400_000
  )

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays <= 7) return "Previous 7 days"
  return "Older"
}

export function groupSessions(
  sessions: ChatSessionListItem[],
  preferences: Record<string, SessionPreferences>,
  groupBy: GroupByOption
): SessionGroup[] {
  const sorted = sortSessions(sessions, preferences)

  if (groupBy === "none") {
    return [{ label: "Recents", sessions: sorted }]
  }

  const buckets = new Map<string, ChatSessionListItem[]>()

  for (const session of sorted) {
    const prefs = preferences[session.id] ?? {}
    let label = "Recents"

    switch (groupBy) {
      case "date":
        label = dateGroupLabel(session.updated_at)
        break
      case "project":
        label = prefs.project?.trim() || "Unassigned"
        break
      case "unread":
        label = prefs.unread ? "Unread" : "Read"
        break
      case "status":
        label = isSessionArchived(prefs) ? "Archived" : "Active"
        break
      default:
        break
    }

    const existing = buckets.get(label) ?? []
    existing.push(session)
    buckets.set(label, existing)
  }

  const order =
    groupBy === "date"
      ? ["Today", "Yesterday", "Previous 7 days", "Older"]
      : groupBy === "unread"
        ? ["Unread", "Read"]
        : groupBy === "status"
          ? ["Active", "Archived"]
          : null

  const entries = [...buckets.entries()]
  if (order) {
    entries.sort(([a], [b]) => {
      const ai = order.indexOf(a)
      const bi = order.indexOf(b)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
  } else {
    entries.sort(([a], [b]) => a.localeCompare(b))
  }

  return entries.map(([label, groupSessionsList]) => ({
    label,
    sessions: groupSessionsList,
  }))
}
