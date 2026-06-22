export type Point = { x: number; y: number }

export type SnakeLevelId =
  | "ready"
  | "moderate"
  | "difficult"
  | "very-difficult"
  | "toughest"
  | "cannot-play"

export type SnakeLevel = {
  id: SnakeLevelId
  label: string
  description: string
  baseTickMs: number
  minTickMs: number
  speedPerScore: number
  playable: boolean
  patternCount: number
}

export type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

export type GameState = {
  snake: Point[]
  prevSnake: Point[]
  direction: Point
  nextDirection: Point
  food: Point
  obstacles: Set<string>
  alive: boolean
  score: number
  progress: number
  eatFlash: number
  particles: Particle[]
  levelId: SnakeLevelId
}

export type ScoreEntry = {
  id: string
  playerName: string
  score: number
  levelId: SnakeLevelId
  levelLabel: string
  playedAt: string
}

export type PlayerProfile = {
  name: string
  createdAt: string
}
