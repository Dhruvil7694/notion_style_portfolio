import type { SnakeLevel, SnakeLevelId } from "@/lib/public/snake-game/types"

export const SNAKE_LEVELS: SnakeLevel[] = [
  {
    id: "ready",
    label: "Ready",
    description: "Gentle pace, open field. Learn the rhythm.",
    baseTickMs: 130,
    minTickMs: 95,
    speedPerScore: 2,
    playable: true,
    patternCount: 0,
  },
  {
    id: "moderate",
    label: "Moderate",
    description: "A few line obstacles appear. Stay alert.",
    baseTickMs: 110,
    minTickMs: 78,
    speedPerScore: 3,
    playable: true,
    patternCount: 3,
  },
  {
    id: "difficult",
    label: "Difficult",
    description: "More walls, faster ticks, tighter turns.",
    baseTickMs: 95,
    minTickMs: 68,
    speedPerScore: 3,
    playable: true,
    patternCount: 4,
  },
  {
    id: "very-difficult",
    label: "Very Difficult",
    description: "Cross-shaped barriers and less room to breathe.",
    baseTickMs: 82,
    minTickMs: 58,
    speedPerScore: 4,
    playable: true,
    patternCount: 5,
  },
  {
    id: "toughest",
    label: "Toughest",
    description: "Dense maze lines. One mistake ends the run.",
    baseTickMs: 72,
    minTickMs: 50,
    speedPerScore: 4,
    playable: true,
    patternCount: 7,
  },
  {
    id: "cannot-play",
    label: "And you cannot play!",
    description: "You asked for it. The board disagrees.",
    baseTickMs: 40,
    minTickMs: 40,
    speedPerScore: 0,
    playable: false,
    patternCount: 8,
  },
]

const LEVEL_MAP = new Map(SNAKE_LEVELS.map((level) => [level.id, level]))

export function getSnakeLevel(id: SnakeLevelId): SnakeLevel {
  return LEVEL_MAP.get(id) ?? SNAKE_LEVELS[0]!
}

export function getDefaultLevelId(): SnakeLevelId {
  return "ready"
}
