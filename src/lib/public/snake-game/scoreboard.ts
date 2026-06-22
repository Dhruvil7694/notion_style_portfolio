import { getSnakeLevel } from "@/lib/public/snake-game/levels"
import type { PlayerProfile, ScoreEntry, SnakeLevelId } from "@/lib/public/snake-game/types"

const PLAYER_KEY = "about-snake-player-v1"
const SCORES_KEY = "about-snake-scores-v1"
const MAX_SCORES = 20

const LEVEL_RANK: Record<SnakeLevelId, number> = {
  ready: 1,
  moderate: 2,
  difficult: 3,
  "very-difficult": 4,
  toughest: 5,
  "cannot-play": 6,
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return fallback
    }

    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function normalizePlayerName(name: string): string {
  return name.trim().toLowerCase()
}

export function compareScoreEntries(a: ScoreEntry, b: ScoreEntry): number {
  if (b.score !== a.score) {
    return b.score - a.score
  }

  const levelDiff = LEVEL_RANK[b.levelId] - LEVEL_RANK[a.levelId]
  if (levelDiff !== 0) {
    return levelDiff
  }

  return new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
}

function isScoreBetter(candidate: ScoreEntry, existing: ScoreEntry): boolean {
  return compareScoreEntries(candidate, existing) < 0
}

function dedupeScoreboard(entries: ScoreEntry[]): ScoreEntry[] {
  const byPlayer = new Map<string, ScoreEntry>()

  for (const entry of entries) {
    const key = normalizePlayerName(entry.playerName)
    const existing = byPlayer.get(key)

    if (!existing || compareScoreEntries(entry, existing) < 0) {
      byPlayer.set(key, entry)
    }
  }

  return [...byPlayer.values()].sort(compareScoreEntries)
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

export function loadPlayerProfile(): PlayerProfile | null {
  return readJson<PlayerProfile | null>(PLAYER_KEY, null)
}

export function savePlayerProfile(name: string): PlayerProfile {
  const profile: PlayerProfile = {
    name: name.trim(),
    createdAt: new Date().toISOString(),
  }
  writeJson(PLAYER_KEY, profile)
  return profile
}

export function loadScoreboard(): ScoreEntry[] {
  const entries = readJson<ScoreEntry[]>(SCORES_KEY, [])
  const deduped = dedupeScoreboard(entries)

  if (deduped.length !== entries.length) {
    writeJson(SCORES_KEY, deduped)
  }

  return deduped
}

export function saveScoreEntry(input: {
  playerName: string
  score: number
  levelId: SnakeLevelId
}): ScoreEntry[] {
  if (input.score <= 0) {
    return loadScoreboard()
  }

  const level = getSnakeLevel(input.levelId)
  const playerName = input.playerName.trim()
  const normalizedName = normalizePlayerName(playerName)
  const existing = loadScoreboard()
  const existingIndex = existing.findIndex(
    (entry) => normalizePlayerName(entry.playerName) === normalizedName
  )

  const candidate: ScoreEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    playerName,
    score: input.score,
    levelId: input.levelId,
    levelLabel: level.label,
    playedAt: new Date().toISOString(),
  }

  let next: ScoreEntry[]

  if (existingIndex >= 0) {
    const current = existing[existingIndex]!

    if (!isScoreBetter(candidate, current)) {
      return existing
    }

    next = [...existing]
    next[existingIndex] = {
      ...candidate,
      id: current.id,
    }
  } else {
    next = [...existing, candidate]
  }

  next = next.sort(compareScoreEntries).slice(0, MAX_SCORES)
  writeJson(SCORES_KEY, next)
  return next
}

export function getWinner(entries: ScoreEntry[]): ScoreEntry | null {
  if (entries.length === 0) {
    return null
  }

  return [...entries].sort(compareScoreEntries)[0] ?? null
}

export function getPersonalBest(
  entries: ScoreEntry[],
  playerName: string
): ScoreEntry | null {
  const normalized = normalizePlayerName(playerName)
  return (
    entries.find(
      (entry) => normalizePlayerName(entry.playerName) === normalized
    ) ?? null
  )
}
