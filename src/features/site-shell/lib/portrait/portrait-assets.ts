import type { StaticImageData } from "next/image"

import lookingDown from "@/shared/assets/profile image/looking down.png"
import lookingLeft from "@/shared/assets/profile image/looking left.png"
import lookingRight from "@/shared/assets/profile image/looking right.png"
import lookingStraight from "@/shared/assets/profile image/looking straight.png"
import lookingUp from "@/shared/assets/profile image/looking up.png"

export type PortraitGaze = "straight" | "left" | "right" | "up" | "down"

export const PORTRAIT_GAZE_KEYS: PortraitGaze[] = [
  "straight",
  "left",
  "right",
  "up",
  "down",
]

export const PORTRAIT_IMAGES: Record<PortraitGaze, StaticImageData> = {
  straight: lookingStraight,
  left: lookingLeft,
  right: lookingRight,
  up: lookingUp,
  down: lookingDown,
}

export function getGazeFromPointer(x: number, y: number): PortraitGaze {
  const absX = Math.abs(x)
  const absY = Math.abs(y)

  if (absX < 0.28 && absY < 0.28) {
    return "straight"
  }

  if (absX >= absY) {
    return x < 0 ? "left" : "right"
  }

  return y < 0 ? "up" : "down"
}

export function preloadPortraitImages() {
  for (const image of Object.values(PORTRAIT_IMAGES)) {
    const img = new window.Image()
    img.src = image.src
  }
}
