"use client"

import { Eye } from "lucide-react"
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react"

import { cn } from "@/shared/lib/utils"

const STORAGE_KEY = "dhruvil-workspace-views"
const BASE_VIEWS = 213
const PARTICLE_COUNT = 14

type Particle = {
  id: number
  angle: number
  distance: number
}

function readViewCount(): number {
  if (typeof window === "undefined") {
    return BASE_VIEWS
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  const parsed = stored ? Number.parseInt(stored, 10) : Number.NaN

  return Number.isFinite(parsed) ? parsed : BASE_VIEWS
}

function writeViewCount(count: number) {
  window.localStorage.setItem(STORAGE_KEY, String(count))
}

export function WorkspaceViewCounter() {
  const [count, setCount] = useState(BASE_VIEWS)
  const [particles, setParticles] = useState<Particle[]>([])
  const [bursting, setBursting] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const particleIdRef = useRef(0)
  const labelId = useId()

  useEffect(() => {
    setCount(readViewCount())
  }, [])

  const spawnParticles = useCallback(() => {
    const next = Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
      id: particleIdRef.current++,
      angle: (360 / PARTICLE_COUNT) * index + Math.random() * 18,
      distance: 28 + Math.random() * 22,
    }))

    setParticles(next)
    setBursting(true)

    window.setTimeout(() => {
      setParticles([])
      setBursting(false)
    }, 720)
  }, [])

  const handleClick = () => {
    const next = count + 1
    setCount(next)
    writeViewCount(next)
    spawnParticles()
  }

  return (
    <div className="workspace-view-counter">
      <button
        ref={buttonRef}
        aria-labelledby={labelId}
        className={cn(
          "workspace-view-counter-button",
          bursting && "is-bursting"
        )}
        onClick={handleClick}
        type="button"
      >
        <Eye
          aria-hidden
          className="workspace-view-counter-icon"
          strokeWidth={1.75}
        />
        <span className="workspace-view-counter-value">
          {count.toLocaleString()}
        </span>
        <span className="workspace-view-counter-spark" aria-hidden />
        {particles.map((particle) => (
          <span
            aria-hidden
            className="workspace-view-counter-particle"
            key={particle.id}
            style={
              {
                "--particle-angle": `${particle.angle}deg`,
                "--particle-distance": `${particle.distance}px`,
              } as CSSProperties
            }
          />
        ))}
      </button>
      <span className="sr-only" id={labelId}>
        Portfolio views: {count}. Click to register a visit.
      </span>
    </div>
  )
}
