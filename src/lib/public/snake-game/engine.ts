import { getSnakeLevel } from "@/lib/public/snake-game/levels"
import { buildImpossibleObstacles, buildObstacles } from "@/lib/public/snake-game/obstacles"
import type { GameState, Point, SnakeLevelId } from "@/lib/public/snake-game/types"

export const CELL = 16

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}

export function pointKey(point: Point): string {
  return `${point.x},${point.y}`
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

export function tickMsForScore(levelId: SnakeLevelId, score: number): number {
  const level = getSnakeLevel(levelId)
  return Math.max(
    level.minTickMs,
    level.baseTickMs - score * level.speedPerScore
  )
}

function minDistanceToObstacles(point: Point, obstacles: Set<string>): number {
  if (obstacles.size === 0) {
    return Number.POSITIVE_INFINITY
  }

  let min = Number.POSITIVE_INFINITY

  for (const key of obstacles) {
    const [xRaw, yRaw] = key.split(",")
    const ox = Number(xRaw)
    const oy = Number(yRaw)
    const dist = Math.abs(point.x - ox) + Math.abs(point.y - oy)
    if (dist < min) {
      min = dist
    }
  }

  return min
}

/** Lower target = food spawns closer to walls/obstacles. */
function targetFoodProximity(levelId: SnakeLevelId, score: number): number {
  const base: Record<SnakeLevelId, number | null> = {
    ready: null,
    moderate: 3,
    difficult: 2,
    "very-difficult": 1,
    toughest: 1,
    "cannot-play": 0,
  }

  const baseDistance = base[levelId]
  if (baseDistance === null) {
    return Number.POSITIVE_INFINITY
  }

  return Math.max(1, baseDistance - Math.floor(score / 4))
}

function pickWeightedFood(candidates: Point[], weights: number[]): Point {
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  if (total <= 0) {
    return candidates[0] ?? { x: 0, y: 0 }
  }

  let roll = Math.random() * total

  for (let i = 0; i < candidates.length; i += 1) {
    roll -= weights[i] ?? 0
    if (roll <= 0) {
      return candidates[i]!
    }
  }

  return candidates[candidates.length - 1] ?? { x: 0, y: 0 }
}

export function randomFood(
  cols: number,
  rows: number,
  snake: Point[],
  obstacles: Set<string>,
  levelId: SnakeLevelId,
  score: number
): Point {
  const occupied = new Set([...snake.map(pointKey), ...obstacles])
  const candidates: Point[] = []

  for (let x = 0; x < cols; x += 1) {
    for (let y = 0; y < rows; y += 1) {
      const point = { x, y }
      if (!occupied.has(pointKey(point))) {
        candidates.push(point)
      }
    }
  }

  if (candidates.length === 0) {
    return { x: 0, y: 0 }
  }

  const target = targetFoodProximity(levelId, score)
  if (!Number.isFinite(target)) {
    return candidates[Math.floor(Math.random() * candidates.length)]!
  }

  const weights = candidates.map((point) => {
    const dist = minDistanceToObstacles(point, obstacles)

    if (dist <= target) {
      return 6 + (target - dist + 1) * 4
    }

    if (dist === target + 1) {
      return 2.5
    }

    if (dist === target + 2) {
      return 1
    }

    return 0.15
  })

  return pickWeightedFood(candidates, weights)
}

function createSnakeStart(cols: number, rows: number): Point[] {
  const center = { x: Math.floor(cols / 2), y: Math.floor(rows / 2) }
  return [center, { x: center.x - 1, y: center.y }, { x: center.x - 2, y: center.y }]
}

export function createInitialState(
  cols: number,
  rows: number,
  levelId: SnakeLevelId
): GameState {
  const level = getSnakeLevel(levelId)
  const snake = createSnakeStart(cols, rows)
  const obstacles =
    level.id === "cannot-play"
      ? buildImpossibleObstacles(cols, rows, snake)
      : buildObstacles(cols, rows, levelId, snake)

  return {
    snake,
    prevSnake: snake.map((segment) => ({ ...segment })),
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    food: randomFood(cols, rows, snake, obstacles, levelId, 0),
    obstacles,
    alive: level.playable,
    score: 0,
    progress: 1,
    eatFlash: 0,
    particles: [],
    levelId,
  }
}

export type StepResult = {
  gameOver: boolean
  scored: boolean
}

export function stepGame(
  state: GameState,
  cols: number,
  rows: number
): StepResult {
  const level = getSnakeLevel(state.levelId)

  if (!state.alive || !level.playable) {
    return { gameOver: !state.alive, scored: false }
  }

  state.prevSnake = state.snake.map((segment) => ({ ...segment }))
  state.progress = 0

  const dir = state.nextDirection
  if (dir.x !== -state.direction.x || dir.y !== -state.direction.y) {
    state.direction = dir
  }

  const head = state.snake[0]
  if (!head) {
    return { gameOver: true, scored: false }
  }

  const next = {
    x: head.x + state.direction.x,
    y: head.y + state.direction.y,
  }

  const hitWall = next.x < 0 || next.y < 0 || next.x >= cols || next.y >= rows
  const hitSelf = state.snake.some((segment) => samePoint(segment, next))
  const hitObstacle = state.obstacles.has(pointKey(next))

  if (hitWall || hitSelf || hitObstacle) {
    state.alive = false
    state.progress = 1
    return { gameOver: true, scored: false }
  }

  state.snake.unshift(next)

  if (samePoint(next, state.food)) {
    state.score += 1
    state.eatFlash = 1
    state.food = randomFood(
      cols,
      rows,
      state.snake,
      state.obstacles,
      state.levelId,
      state.score
    )
    return { gameOver: false, scored: true }
  }

  state.snake.pop()
  return { gameOver: false, scored: false }
}

export function spawnEatParticles(x: number, y: number, cell: number) {
  return Array.from({ length: 10 }, () => {
    const angle = Math.random() * Math.PI * 2
    const speed = 0.6 + Math.random() * 1.4
    return {
      x: x * cell + cell / 2,
      y: y * cell + cell / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.55 + Math.random() * 0.35,
    }
  })
}
