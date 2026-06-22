import { getSnakeLevel } from "@/lib/public/snake-game/levels"
import type { Point, SnakeLevelId } from "@/lib/public/snake-game/types"

export type ObstaclePattern = {
  id: string
  cells: Point[]
  landscapeOnly?: boolean
}

/** Orthogonally connected wall shapes — solid blocks, not scattered dots. */
export const OBSTACLE_PATTERNS: ObstaclePattern[] = [
  {
    id: "bar-h-6",
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 5, y: 0 },
    ],
    landscapeOnly: true,
  },
  {
    id: "bar-h-4",
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ],
  },
  {
    id: "bar-v-5",
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
      { x: 0, y: 4 },
    ],
  },
  {
    id: "bar-v-3",
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
    ],
  },
  {
    id: "wall-l",
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
    ],
  },
  {
    id: "wall-t",
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ],
  },
  {
    id: "block-2",
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
  {
    id: "ring-3",
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
  },
  {
    id: "gate",
    cells: [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
  },
  {
    id: "corridor-h",
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 4, y: 2 },
    ],
    landscapeOnly: true,
  },
  {
    id: "cross",
    cells: [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
    ],
  },
  {
    id: "pillar",
    cells: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
  },
]

const PATTERN_MAP = new Map(
  OBSTACLE_PATTERNS.map((pattern) => [pattern.id, pattern])
)

const LEVEL_PATTERN_IDS: Record<SnakeLevelId, string[]> = {
  ready: [],
  moderate: ["bar-h-4", "bar-v-3", "wall-l", "block-2"],
  difficult: ["wall-l", "wall-t", "block-2", "cross", "bar-h-4"],
  "very-difficult": ["cross", "gate", "ring-3", "corridor-h", "pillar"],
  toughest: ["corridor-h", "cross", "gate", "pillar", "wall-l", "ring-3", "wall-t"],
  "cannot-play": [],
}

type PlacementZone = "left" | "center" | "right" | "top" | "bottom" | "any"

function pointKey(point: Point): string {
  return `${point.x},${point.y}`
}

function isLandscape(cols: number, rows: number): boolean {
  return cols / rows >= 1.35
}

function patternBounds(pattern: ObstaclePattern) {
  let maxX = 0
  let maxY = 0

  for (const cell of pattern.cells) {
    maxX = Math.max(maxX, cell.x)
    maxY = Math.max(maxY, cell.y)
  }

  return { width: maxX + 1, height: maxY + 1 }
}

function getPatternsForLevel(levelId: SnakeLevelId, cols: number, rows: number) {
  const ids = LEVEL_PATTERN_IDS[levelId]
  const landscape = isLandscape(cols, rows)

  return ids
    .map((id) => PATTERN_MAP.get(id))
    .filter((pattern): pattern is ObstaclePattern => {
      if (!pattern) {
        return false
      }

      if (pattern.landscapeOnly && !landscape) {
        return false
      }

      return true
    })
}

function getOriginRange(
  cols: number,
  rows: number,
  pattern: ObstaclePattern,
  zone: PlacementZone
) {
  const margin = 2
  const { width, height } = patternBounds(pattern)
  const minX = margin
  const maxX = Math.max(margin, cols - width - margin)
  const minY = margin
  const maxY = Math.max(margin, rows - height - margin)
  const centerMinX = Math.floor(cols * 0.28)
  const centerMaxX = Math.floor(cols * 0.72) - width
  const centerMinY = Math.floor(rows * 0.28)
  const centerMaxY = Math.floor(rows * 0.72) - height

  switch (zone) {
    case "left":
      return {
        minX,
        maxX: Math.max(minX, Math.floor(cols * 0.38) - width),
        minY,
        maxY,
      }
    case "right":
      return {
        minX: Math.min(maxX, Math.floor(cols * 0.62)),
        maxX,
        minY,
        maxY,
      }
    case "top":
      return {
        minX,
        maxX,
        minY,
        maxY: Math.max(minY, Math.floor(rows * 0.42) - height),
      }
    case "bottom":
      return {
        minX,
        maxX,
        minY: Math.min(maxY, Math.floor(rows * 0.58)),
        maxY,
      }
    case "center":
      return {
        minX: Math.max(minX, centerMinX),
        maxX: Math.min(maxX, centerMaxX),
        minY: Math.max(minY, centerMinY),
        maxY: Math.min(maxY, centerMaxY),
      }
    default:
      return { minX, maxX, minY, maxY }
  }
}

function canPlacePattern(
  pattern: ObstaclePattern,
  origin: Point,
  cols: number,
  rows: number,
  blocked: Set<string>
): boolean {
  for (const cell of pattern.cells) {
    const x = origin.x + cell.x
    const y = origin.y + cell.y

    if (x < 1 || y < 1 || x >= cols - 1 || y >= rows - 1) {
      return false
    }

    if (blocked.has(pointKey({ x, y }))) {
      return false
    }
  }

  return true
}

function placePattern(
  pattern: ObstaclePattern,
  origin: Point,
  obstacles: Set<string>,
  blocked: Set<string>
): void {
  for (const cell of pattern.cells) {
    const point = { x: origin.x + cell.x, y: origin.y + cell.y }
    const key = pointKey(point)
    obstacles.add(key)
    blocked.add(key)
  }
}

const PLACEMENT_ZONES: PlacementZone[] = [
  "center",
  "left",
  "right",
  "top",
  "bottom",
  "any",
  "center",
  "any",
]

function placeInternalPatterns(
  cols: number,
  rows: number,
  levelId: SnakeLevelId,
  patternCount: number,
  blocked: Set<string>,
  obstacles: Set<string>
): void {
  const patterns = getPatternsForLevel(levelId, cols, rows)
  if (patterns.length === 0 || patternCount === 0) {
    return
  }

  const shuffled = [...patterns].sort(() => Math.random() - 0.5)

  for (let i = 0; i < patternCount; i += 1) {
    const pattern = shuffled[i % shuffled.length]!
    const zone = PLACEMENT_ZONES[i % PLACEMENT_ZONES.length] ?? "any"
    let placed = false

    for (let attempt = 0; attempt < 60; attempt += 1) {
      const range = getOriginRange(cols, rows, pattern, zone)
      if (range.maxX < range.minX || range.maxY < range.minY) {
        continue
      }

      const origin = {
        x:
          range.minX +
          Math.floor(Math.random() * (range.maxX - range.minX + 1)),
        y:
          range.minY +
          Math.floor(Math.random() * (range.maxY - range.minY + 1)),
      }

      if (!canPlacePattern(pattern, origin, cols, rows, blocked)) {
        continue
      }

      placePattern(pattern, origin, obstacles, blocked)
      placed = true
      break
    }

    if (!placed && i > 1) {
      break
    }
  }
}

export function buildObstacles(
  cols: number,
  rows: number,
  levelId: SnakeLevelId,
  reserved: Point[]
): Set<string> {
  const level = getSnakeLevel(levelId)
  const obstacles = new Set<string>()
  const blocked = new Set(reserved.map(pointKey))

  placeInternalPatterns(
    cols,
    rows,
    levelId,
    level.patternCount,
    blocked,
    obstacles
  )

  return obstacles
}

export function buildImpossibleObstacles(
  cols: number,
  rows: number,
  reserved: Point[]
): Set<string> {
  const blocked = new Set(reserved.map(pointKey))
  const obstacles = new Set<string>()

  for (let x = 1; x < cols - 1; x += 1) {
    for (let y = 1; y < rows - 1; y += 1) {
      const key = pointKey({ x, y })
      if (!blocked.has(key) && (x + y) % 2 === 0) {
        obstacles.add(key)
      }
    }
  }

  return obstacles
}
