"use client"

import {
  BookOpen,
  Expand,
  Trophy,
  X,
} from "lucide-react"
import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"

import { useSiteTheme } from "@/components/public/site-theme-provider"
import { caveatHandwriting } from "@/lib/fonts/caveat"
import {
  CELL,
  createInitialState,
  easeOutCubic,
  lerp,
  spawnEatParticles,
  stepGame,
  tickMsForScore,
} from "@/lib/public/snake-game/engine"
import { getDefaultLevelId, getSnakeLevel, SNAKE_LEVELS } from "@/lib/public/snake-game/levels"
import { getSnakePalette } from "@/lib/public/snake-game/palette"
import {
  getPersonalBest,
  getWinner,
  loadPlayerProfile,
  loadScoreboard,
  savePlayerProfile,
  saveScoreEntry,
} from "@/lib/public/snake-game/scoreboard"
import type { GameState, ScoreEntry, SnakeLevelId } from "@/lib/public/snake-game/types"
import { glassPanelClass } from "@/lib/public/glass-panel"
import { cn } from "@/lib/utils"

const INSTRUCTIONS = [
  "Use WASD or arrow keys to steer the snake.",
  "Eat the glowing food to grow and score points.",
  "Avoid walls, your tail, and line obstacles.",
  "Press R to restart after game over.",
  "Pick a level — harder modes add more wall shapes.",
  '"And you cannot play!" is a joke mode. Obviously.',
]

type OpenPanel = "scoreboard" | "instructions" | "level" | null

type AboutSnakeGameProps = {
  className?: string
}

function drawSolidObstacles(
  ctx: CanvasRenderingContext2D,
  obstacles: Set<string>,
  cell: number,
  dpr: number,
  fill: string,
  border: string
) {
  ctx.fillStyle = fill
  obstacles.forEach((key) => {
    const [xRaw, yRaw] = key.split(",")
    const x = Number(xRaw) * cell
    const y = Number(yRaw) * cell
    ctx.fillRect(x, y, cell, cell)
  })

  ctx.strokeStyle = border
  ctx.lineWidth = 1.25 * dpr
  obstacles.forEach((key) => {
    const [xRaw, yRaw] = key.split(",")
    const x = Number(xRaw)
    const y = Number(yRaw)
    const px = x * cell
    const py = y * cell

    if (!obstacles.has(`${x - 1},${y}`)) {
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px, py + cell)
      ctx.stroke()
    }

    if (!obstacles.has(`${x + 1},${y}`)) {
      ctx.beginPath()
      ctx.moveTo(px + cell, py)
      ctx.lineTo(px + cell, py + cell)
      ctx.stroke()
    }

    if (!obstacles.has(`${x},${y - 1}`)) {
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px + cell, py)
      ctx.stroke()
    }

    if (!obstacles.has(`${x},${y + 1}`)) {
      ctx.beginPath()
      ctx.moveTo(px, py + cell)
      ctx.lineTo(px + cell, py + cell)
      ctx.stroke()
    }
  })
}

function drawRoundedCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  radius: number,
  fill: string
) {
  const pad = 1.5
  const w = size - pad * 2
  const h = size - pad * 2
  const rx = x + pad
  const ry = y + pad
  const r = Math.min(radius, w / 2, h / 2)

  ctx.beginPath()
  ctx.moveTo(rx + r, ry)
  ctx.arcTo(rx + w, ry, rx + w, ry + h, r)
  ctx.arcTo(rx + w, ry + h, rx, ry + h, r)
  ctx.arcTo(rx, ry + h, rx, ry, r)
  ctx.arcTo(rx, ry, rx + w, ry, r)
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
}

function SnakeScrollPanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [fadeTop, setFadeTop] = useState(false)
  const [fadeBottom, setFadeBottom] = useState(false)

  const updateFades = useCallback(() => {
    const el = scrollRef.current
    if (!el) {
      return
    }

    const { scrollTop, scrollHeight, clientHeight } = el
    setFadeTop(scrollTop > 4)
    setFadeBottom(scrollTop + clientHeight < scrollHeight - 4)
  }, [])

  useEffect(() => {
    updateFades()
    const el = scrollRef.current
    if (!el) {
      return
    }

    el.addEventListener("scroll", updateFades, { passive: true })
    const observer = new ResizeObserver(updateFades)
    observer.observe(el)

    return () => {
      el.removeEventListener("scroll", updateFades)
      observer.disconnect()
    }
  }, [updateFades, children])

  return (
    <div className={cn("about-snake-tool-panel-scroll-wrap", className)}>
      <div className="about-snake-tool-panel-scroll" ref={scrollRef}>
        {children}
      </div>
      <div
        aria-hidden
        className={cn("about-snake-tool-panel-fade-top", fadeTop && "is-visible")}
      />
      <div
        aria-hidden
        className={cn("about-snake-tool-panel-fade-bottom", fadeBottom && "is-visible")}
      />
    </div>
  )
}

function SnakeToolHover({
  panelId,
  open,
  onOpen,
  onClose,
  label,
  icon,
  panelClassName,
  children,
}: {
  panelId: string
  open: boolean
  onOpen: () => void
  onClose: () => void
  label: ReactNode
  icon?: ReactNode
  panelClassName?: string
  children: ReactNode
}) {
  return (
    <div
      className="about-snake-tool"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <button
        aria-describedby={open ? panelId : undefined}
        aria-expanded={open}
        className="about-snake-tool-btn"
        type="button"
      >
        {icon}
        {label}
      </button>
      <div
        className={cn(
          "about-snake-tool-panel",
          glassPanelClass,
          panelClassName,
          open && "is-open"
        )}
        id={panelId}
        role="dialog"
      >
        {children}
      </div>
    </div>
  )
}

function LevelButtonGroup({
  activeLevelId,
  onSelect,
  compact = false,
}: {
  activeLevelId: SnakeLevelId
  onSelect: (levelId: SnakeLevelId) => void
  compact?: boolean
}) {
  return (
    <div
      aria-label="Choose level"
      className={cn("about-snake-level-buttons", compact && "is-compact")}
      role="group"
    >
      {SNAKE_LEVELS.map((item) => (
        <button
          aria-pressed={item.id === activeLevelId}
          className={cn(
            "about-snake-level-btn",
            item.id === activeLevelId && "is-active"
          )}
          key={item.id}
          onClick={() => onSelect(item.id)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

type GameBoardProps = {
  wrapRef: RefObject<HTMLDivElement | null>
  popup?: boolean
  started: boolean
  active: boolean
  playerName: string
  hasProfile: boolean
  startLevelId: SnakeLevelId
  level: ReturnType<typeof getSnakeLevel>
  score: number
  personalBest: ScoreEntry | null
  gameOver: boolean
  deathPaused: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onPlayerNameChange: (value: string) => void
  onStartLevelSelect: (levelId: SnakeLevelId) => void
  onStart: () => void
  onPlayAgain: () => void
  onBurstMove: () => void
  canvasRef: RefObject<HTMLCanvasElement | null>
}

function GameBoard({
  wrapRef,
  popup = false,
  started,
  playerName,
  hasProfile,
  startLevelId,
  level,
  score,
  personalBest,
  gameOver,
  deathPaused,
  onMouseEnter,
  onMouseLeave,
  onPlayerNameChange,
  onStartLevelSelect,
  onStart,
  onPlayAgain,
  onBurstMove,
  canvasRef,
}: GameBoardProps) {
  const startLevel = getSnakeLevel(startLevelId)

  return (
    <div
      aria-label="Snake game"
      className={cn("about-snake-wrap", popup && "about-snake-wrap-popup")}
      onDoubleClick={onBurstMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={wrapRef}
      role="application"
      tabIndex={0}
    >
      <canvas aria-hidden className="about-snake-canvas" ref={canvasRef} />

      <div className="about-snake-overlay">
        {!started ? (
          <div className="about-snake-start-panel">
            <div className="about-snake-start-inner">
            <p className={cn("about-snake-start-title", caveatHandwriting.className)}>
              {hasProfile ? `Welcome back, ${playerName}` : "Enter your name"}
            </p>
            <label className="about-snake-name-label" htmlFor="about-snake-player-name">
              Player name
            </label>
            <input
              className="about-snake-name-input"
              id="about-snake-player-name"
              maxLength={24}
              onChange={(event) => onPlayerNameChange(event.target.value)}
              placeholder="Your name"
              value={playerName}
            />

            <p className="about-snake-name-label">Level</p>
            <LevelButtonGroup
              activeLevelId={startLevelId}
              onSelect={onStartLevelSelect}
            />

            <button
              className="about-snake-start-btn"
              disabled={!playerName.trim()}
              onClick={onStart}
              type="button"
            >
              Start game
            </button>
            <p className="about-snake-start-note">
              Playing on {startLevel.label}.
            </p>
            </div>
          </div>
        ) : null}

        {started ? (
          <div aria-live="polite" className="about-snake-scores">
            <span className="about-snake-score-current">{score}</span>
            {personalBest ? (
              <span className="about-snake-score-best">best {personalBest.score}</span>
            ) : null}
            <span className="about-snake-score-level">{level.label}</span>
            {gameOver ? <span className="about-snake-score-restart">Press R</span> : null}
            {deathPaused ? (
              <span className="about-snake-score-restart">Game over…</span>
            ) : null}
          </div>
        ) : null}

        {started && deathPaused ? (
          <div aria-live="polite" className="about-snake-death-pause">
            <p className={cn("about-snake-death-pause-title", caveatHandwriting.className)}>
              Crashed
            </p>
          </div>
        ) : null}

        {started && gameOver && !deathPaused ? (
          <div className="about-snake-gameover">
            <p className={cn("about-snake-gameover-title", caveatHandwriting.className)}>
              Game over
            </p>
            <p className="about-snake-gameover-copy">
              {score > 0 ? `${playerName} scored ${score} on ${level.label}.` : "Ouch."}
            </p>
            <button className="about-snake-start-btn" onClick={onPlayAgain} type="button">
              Play again
            </button>
          </div>
        ) : null}

        {started && !level.playable && !gameOver ? (
          <div className="about-snake-gameover">
            <p className={cn("about-snake-gameover-title", caveatHandwriting.className)}>
              Told you so
            </p>
            <p className="about-snake-gameover-copy">
              The board is blocked. Pick a real level and try again.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function AboutSnakeGame({ className }: AboutSnakeGameProps) {
  const { theme } = useSiteTheme()
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState | null>(null)
  const gridRef = useRef({ cols: 0, rows: 0, cellPx: CELL })
  const rafRef = useRef<number | null>(null)
  const lastStepRef = useRef(0)
  const activeRef = useRef(false)
  const pulseRef = useRef(0)
  const playerNameRef = useRef("")
  const scoreSavedRef = useRef(false)
  const deathTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastDirectionTapRef = useRef<{ key: string; time: number } | null>(null)

  const [mounted, setMounted] = useState(false)
  const [playerName, setPlayerName] = useState("")
  const [hasProfile, setHasProfile] = useState(false)
  const [started, setStarted] = useState(false)
  const [active, setActive] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null)
  const [levelId, setLevelId] = useState<SnakeLevelId>(getDefaultLevelId())
  const [startLevelId, setStartLevelId] = useState<SnakeLevelId>(getDefaultLevelId())
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [deathPaused, setDeathPaused] = useState(false)
  const [scores, setScores] = useState<ScoreEntry[]>([])
  const [personalBest, setPersonalBest] = useState<ScoreEntry | null>(null)

  const scoreboardPanelId = useId()
  const instructionsPanelId = useId()
  const levelPanelId = useId()

  const level = getSnakeLevel(levelId)
  const winner = getWinner(scores)

  const syncGrid = useCallback(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) {
      return
    }

    const width = wrap.clientWidth
    const height = wrap.clientHeight
    const dpr = window.devicePixelRatio || 1

    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const cols = Math.max(10, Math.floor(width / CELL))
    const rows = Math.max(8, Math.floor(height / CELL))
    const cellPx = Math.min(width / cols, height / rows)
    gridRef.current = { cols, rows, cellPx }
  }, [])

  const clearDeathTimeout = useCallback(() => {
    if (deathTimeoutRef.current) {
      clearTimeout(deathTimeoutRef.current)
      deathTimeoutRef.current = null
    }
  }, [])

  const resetGame = useCallback(() => {
    const { cols, rows } = gridRef.current
    if (cols === 0 || rows === 0) {
      return
    }

    clearDeathTimeout()
    stateRef.current = createInitialState(cols, rows, levelId)
    scoreSavedRef.current = false
    setScore(0)
    setGameOver(false)
    setDeathPaused(false)
    lastStepRef.current = performance.now()
    lastDirectionTapRef.current = null
  }, [clearDeathTimeout, levelId])

  const saveScoreOnDeath = useCallback(
    (finalScore: number) => {
      if (scoreSavedRef.current || finalScore <= 0) {
        return
      }

      const name = playerNameRef.current.trim()
      if (!name) {
        return
      }

      scoreSavedRef.current = true
      const nextScores = saveScoreEntry({
        playerName: name,
        score: finalScore,
        levelId,
      })
      setScores(nextScores)
      setPersonalBest(getPersonalBest(nextScores, name))
    },
    [levelId]
  )

  const triggerDeathSequence = useCallback(
    (finalScore: number) => {
      setActive(false)
      setDeathPaused(true)
      setGameOver(false)
      clearDeathTimeout()

      deathTimeoutRef.current = setTimeout(() => {
        setDeathPaused(false)
        setGameOver(true)
        saveScoreOnDeath(finalScore)
        deathTimeoutRef.current = null
      }, 3000)
    },
    [clearDeathTimeout, saveScoreOnDeath]
  )

  const render = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current
      const state = stateRef.current
      if (!canvas || !state) {
        return
      }

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        return
      }

      const dpr = window.devicePixelRatio || 1
      const { cols, rows, cellPx } = gridRef.current
      const cell = cellPx * dpr
      const w = canvas.width
      const h = canvas.height
      const t = easeOutCubic(state.progress)
      pulseRef.current = timestamp * 0.004
      const palette = getSnakePalette(theme)
      const drawGameplay = started

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, w, h)

      ctx.fillStyle = palette.gridDot
      for (let x = 0; x <= cols; x += 1) {
        for (let y = 0; y <= rows; y += 1) {
          ctx.beginPath()
          ctx.arc(x * cell, y * cell, 0.8 * dpr, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (drawGameplay) {
      drawSolidObstacles(
        ctx,
        state.obstacles,
        cell,
        dpr,
        palette.obstacle,
        palette.obstacleBorder
      )

      const foodPulse = 0.82 + Math.sin(pulseRef.current) * 0.18
      const foodSize = cell * foodPulse
      const foodOffset = (cell - foodSize) / 2
      const foodX = state.food.x * cell + foodOffset
      const foodY = state.food.y * cell + foodOffset

      ctx.shadowBlur = 14 * dpr
      ctx.shadowColor = palette.foodShadow
      drawRoundedCell(ctx, foodX, foodY, foodSize, 4 * dpr, palette.food)
      ctx.shadowBlur = 0

      const snakeLen = state.snake.length
      state.snake.forEach((segment, index) => {
        const prev = state.prevSnake[index] ?? segment
        const px = lerp(prev.x, segment.x, t) * cell
        const py = lerp(prev.y, segment.y, t) * cell
        const alpha = 0.38 + ((snakeLen - index) / snakeLen) * 0.62
        drawRoundedCell(
          ctx,
          px,
          py,
          cell,
          index === 0 ? 5 * dpr : 4 * dpr,
          index === 0 ? palette.snakeHead : palette.snakeBody(alpha)
        )

        if (index === 0) {
          const eyeOffset = 3.2 * dpr
          const cx = px + cell / 2
          const cy = py + cell / 2
          let ex1 = cx
          let ey1 = cy
          let ex2 = cx
          let ey2 = cy

          if (state.direction.x === 1) {
            ex1 += eyeOffset
            ex2 += eyeOffset
            ey1 -= eyeOffset * 0.55
            ey2 += eyeOffset * 0.55
          } else if (state.direction.x === -1) {
            ex1 -= eyeOffset
            ex2 -= eyeOffset
            ey1 -= eyeOffset * 0.55
            ey2 += eyeOffset * 0.55
          } else if (state.direction.y === -1) {
            ey1 -= eyeOffset
            ey2 -= eyeOffset
            ex1 -= eyeOffset * 0.55
            ex2 += eyeOffset * 0.55
          } else {
            ey1 += eyeOffset
            ey2 += eyeOffset
            ex1 -= eyeOffset * 0.55
            ex2 += eyeOffset * 0.55
          }

          ctx.fillStyle = palette.eye
          ctx.beginPath()
          ctx.arc(ex1, ey1, 1.6 * dpr, 0, Math.PI * 2)
          ctx.arc(ex2, ey2, 1.6 * dpr, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      state.particles = state.particles
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.vx * dpr,
          y: particle.y + particle.vy * dpr,
          life: particle.life - 0.022,
        }))
        .filter((particle) => particle.life > 0)

      state.particles.forEach((particle) => {
        ctx.fillStyle = palette.particle(particle.life)
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, 1.4 * dpr, 0, Math.PI * 2)
        ctx.fill()
      })

      if (state.eatFlash > 0) {
        ctx.fillStyle = palette.eatFlash(state.eatFlash)
        ctx.fillRect(0, 0, w, h)
        state.eatFlash = Math.max(0, state.eatFlash - 0.08)
      }

      if (!state.alive) {
        ctx.fillStyle = palette.gameOverOverlay
        ctx.fillRect(0, 0, w, h)
      }
      }

      if (!drawGameplay) {
        ctx.fillStyle = palette.idleOverlay
        ctx.fillRect(0, 0, w, h)
      }
    },
    [started, theme]
  )

  const runGameSteps = useCallback(
    (count: number) => {
      const state = stateRef.current
      const { cols, rows, cellPx } = gridRef.current
      if (!state?.alive) {
        return
      }

      for (let i = 0; i < count; i += 1) {
        if (!state.alive) {
          break
        }

        const result = stepGame(state, cols, rows)

        if (result.scored) {
          setScore(state.score)
          state.particles.push(
            ...spawnEatParticles(
              state.food.x,
              state.food.y,
              cellPx * (window.devicePixelRatio || 1)
            )
          )
        }

        if (result.gameOver) {
          triggerDeathSequence(state.score)
          break
        }
      }

      lastStepRef.current = performance.now()
    },
    [triggerDeathSequence]
  )

  const step = useCallback(() => {
    runGameSteps(1)
  }, [runGameSteps])

  const loop = useCallback(
    (timestamp: number) => {
      if (!activeRef.current) {
        return
      }

      const state = stateRef.current
      if (!state) {
        rafRef.current = window.requestAnimationFrame(loop)
        return
      }

      if (state.alive) {
        const tickMs = tickMsForScore(state.levelId, state.score)
        const elapsed = timestamp - lastStepRef.current

        if (elapsed >= tickMs) {
          lastStepRef.current = timestamp
          step()
        }

        state.progress = Math.min(1, (timestamp - lastStepRef.current) / tickMs)
      }

      render(timestamp)
      rafRef.current = window.requestAnimationFrame(loop)
    },
    [render, step]
  )

  useEffect(() => {
    if (expanded && started) {
      setActive(true)
    }
  }, [expanded, started])

  useEffect(() => {
    setMounted(true)
    const profile = loadPlayerProfile()
    const board = loadScoreboard()

    if (profile?.name) {
      setPlayerName(profile.name)
      playerNameRef.current = profile.name
      setHasProfile(true)
      setPersonalBest(getPersonalBest(board, profile.name))
    }

    setScores(board)
  }, [])

  useEffect(() => {
    playerNameRef.current = playerName
  }, [playerName])

  useEffect(() => {
    if (!wrapRef.current) {
      return
    }

    syncGrid()
    if (!stateRef.current) {
      resetGame()
    }
    render(performance.now())

    const wrap = wrapRef.current
    const observer = new ResizeObserver(() => {
      syncGrid()
      resetGame()
      render(performance.now())
    })

    observer.observe(wrap)
    return () => observer.disconnect()
  }, [render, resetGame, syncGrid, levelId])

  useEffect(() => {
    if (!wrapRef.current) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      syncGrid()
      render(performance.now())
    })

    return () => window.cancelAnimationFrame(frame)
  }, [expanded, render, syncGrid])

  useEffect(() => {
    activeRef.current = active && started

    if (active && started) {
      lastStepRef.current = performance.now()
      rafRef.current = window.requestAnimationFrame(loop)
    } else if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      render(performance.now())
    }

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [active, started, loop, render])

  useEffect(() => {
    if (active && started) {
      return
    }

    let idleFrame = 0
    const idleLoop = (timestamp: number) => {
      render(timestamp)
      idleFrame = window.requestAnimationFrame(idleLoop)
    }

    idleFrame = window.requestAnimationFrame(idleLoop)
    return () => window.cancelAnimationFrame(idleFrame)
  }, [active, started, render])

  useEffect(() => {
    return () => clearDeathTimeout()
  }, [clearDeathTimeout])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!started) {
        return
      }

      const state = stateRef.current
      if (!state) {
        return
      }

      const key = event.key.toLowerCase()

      if (key === "r" && gameOver && !deathPaused) {
        resetGame()
        setActive(true)
        return
      }

      if (!activeRef.current || !state.alive || deathPaused) {
        return
      }

      const directions: Record<string, { x: number; y: number }> = {
        arrowup: { x: 0, y: -1 },
        w: { x: 0, y: -1 },
        arrowdown: { x: 0, y: 1 },
        s: { x: 0, y: 1 },
        arrowleft: { x: -1, y: 0 },
        a: { x: -1, y: 0 },
        arrowright: { x: 1, y: 0 },
        d: { x: 1, y: 0 },
      }

      const next = directions[key]
      if (!next) {
        return
      }

      event.preventDefault()
      state.nextDirection = next

      const now = Date.now()
      const lastTap = lastDirectionTapRef.current

      if (lastTap && lastTap.key === key && now - lastTap.time <= 320) {
        lastDirectionTapRef.current = null
        runGameSteps(2)
        return
      }

      lastDirectionTapRef.current = { key, time: now }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [deathPaused, gameOver, resetGame, runGameSteps, started])

  useEffect(() => {
    if (!expanded) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setExpanded(false)
      }
    }

    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [expanded])

  const handleStart = () => {
    const trimmed = playerName.trim()
    if (!trimmed) {
      return
    }

    savePlayerProfile(trimmed)
    playerNameRef.current = trimmed
    setHasProfile(true)
    setLevelId(startLevelId)
    setStarted(true)
    setActive(true)

    const { cols, rows } = gridRef.current
    if (cols > 0 && rows > 0) {
      stateRef.current = createInitialState(cols, rows, startLevelId)
      scoreSavedRef.current = false
      setScore(0)
      setGameOver(false)
      setDeathPaused(false)
      lastStepRef.current = performance.now()
    }
  }

  const handleLevelSelect = (nextLevelId: SnakeLevelId) => {
    setLevelId(nextLevelId)
    setStartLevelId(nextLevelId)
    setOpenPanel(null)

    const { cols, rows } = gridRef.current
    if (cols > 0 && rows > 0) {
      stateRef.current = createInitialState(cols, rows, nextLevelId)
      scoreSavedRef.current = false
      setScore(0)
      setGameOver(false)
      setDeathPaused(false)
      clearDeathTimeout()
      lastStepRef.current = performance.now()
    }
  }

  const handleStartLevelSelect = (nextLevelId: SnakeLevelId) => {
    setStartLevelId(nextLevelId)
  }

  const boardProps: GameBoardProps = {
    wrapRef,
    started,
    active,
    playerName,
    hasProfile,
    startLevelId,
    level,
    score,
    personalBest,
    gameOver,
    deathPaused,
    canvasRef,
    onMouseEnter: () => {
      if (started) {
        setActive(true)
      }
    },
    onMouseLeave: () => {
      if (!expanded) {
        setActive(false)
      }
    },
    onPlayerNameChange: setPlayerName,
    onStartLevelSelect: handleStartLevelSelect,
    onStart: handleStart,
    onPlayAgain: () => {
      resetGame()
      setActive(true)
    },
    onBurstMove: () => {
      if (!started || deathPaused || gameOver) {
        return
      }

      runGameSteps(2)
    },
  }

  const toolbar = (
    <div className="about-snake-toolbar">
      <div className="about-snake-toolbar-group">
        <SnakeToolHover
          label="Scoreboard"
          icon={<Trophy aria-hidden className="about-snake-tool-icon" strokeWidth={1.75} />}
          onClose={() => setOpenPanel(null)}
          onOpen={() => setOpenPanel("scoreboard")}
          open={openPanel === "scoreboard"}
          panelId={scoreboardPanelId}
        >
          <p className={cn("about-snake-tool-panel-title", caveatHandwriting.className)}>
            Scoreboard
          </p>
          {winner ? (
            <p className="about-snake-winner">
              Winner: <strong>{winner.playerName}</strong> — {winner.score} pts ({winner.levelLabel})
            </p>
          ) : (
            <p className="about-snake-tool-panel-empty">No scores yet. Be the first!</p>
          )}
          <SnakeScrollPanel>
            <ul className="about-snake-score-list">
              {scores.map((entry, index) => (
                <li className="about-snake-score-row" key={entry.id}>
                  <span className="about-snake-score-rank">{index + 1}</span>
                  <span className="about-snake-score-name">{entry.playerName}</span>
                  <span className="about-snake-score-meta">
                    {entry.score} · {entry.levelLabel}
                  </span>
                </li>
              ))}
            </ul>
          </SnakeScrollPanel>
        </SnakeToolHover>

        <SnakeToolHover
          label="Instructions"
          icon={<BookOpen aria-hidden className="about-snake-tool-icon" strokeWidth={1.75} />}
          onClose={() => setOpenPanel(null)}
          onOpen={() => setOpenPanel("instructions")}
          open={openPanel === "instructions"}
          panelId={instructionsPanelId}
        >
          <p className={cn("about-snake-tool-panel-title", caveatHandwriting.className)}>
            How to play
          </p>
          <SnakeScrollPanel>
            <ul className="about-snake-instruction-list">
              {INSTRUCTIONS.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </SnakeScrollPanel>
        </SnakeToolHover>

        <SnakeToolHover
          label={`Level: ${level.label}`}
          onClose={() => setOpenPanel(null)}
          onOpen={() => setOpenPanel("level")}
          open={openPanel === "level"}
          panelClassName="about-snake-level-panel"
          panelId={levelPanelId}
        >
          <p className={cn("about-snake-tool-panel-title", caveatHandwriting.className)}>
            Choose level
          </p>
          <LevelButtonGroup
            activeLevelId={levelId}
            compact
            onSelect={handleLevelSelect}
          />
        </SnakeToolHover>
      </div>

      <button
        aria-label="Expand snake game"
        className="about-snake-tool-btn about-snake-expand-btn"
        onClick={() => setExpanded(true)}
        type="button"
      >
        <Expand aria-hidden className="about-snake-tool-icon" strokeWidth={1.75} />
        Expand
      </button>
    </div>
  )

  return (
    <>
      <div className={cn("about-snake-shell", className)}>
        {toolbar}

        {expanded ? (
          <div aria-hidden className="about-snake-inline-placeholder">
            <p className="about-snake-inline-placeholder-text">Snake game opened in popup</p>
          </div>
        ) : (
          <GameBoard {...boardProps} />
        )}
      </div>

      {mounted && expanded
        ? createPortal(
            <div className="about-snake-popup-root public-site">
              <button
                aria-label="Close expanded snake game backdrop"
                className="about-snake-popup-backdrop"
                onClick={() => setExpanded(false)}
                type="button"
              />
              <div
                className={cn(
                  "about-snake-popup-card",
                  !started && glassPanelClass,
                  started && "about-snake-popup-card-canvas"
                )}
              >
                <button
                  aria-label="Close snake game"
                  className="about-snake-popup-close"
                  onClick={() => setExpanded(false)}
                  type="button"
                >
                  <X aria-hidden className="about-snake-popup-close-icon" strokeWidth={2} />
                </button>
                <GameBoard {...boardProps} popup />
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  )
}
