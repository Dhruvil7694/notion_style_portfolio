import type { SiteTheme } from "@/lib/public/site-theme"

export function getSnakePalette(theme: SiteTheme) {
  if (theme === "light") {
    return {
      gridDot: "rgba(0, 0, 0, 0.06)",
      foodShadow: "rgba(0, 0, 0, 0.25)",
      food: "rgba(0, 0, 0, 0.92)",
      snakeHead: "#000000",
      snakeBody: (alpha: number) => `rgba(0, 0, 0, ${alpha.toFixed(3)})`,
      obstacle: "rgba(0, 0, 0, 0.88)",
      obstacleBorder: "rgba(0, 0, 0, 0.95)",
      eye: "#faf1e7",
      particle: (life: number) => `rgba(0, 0, 0, ${life})`,
      eatFlash: (flash: number) => `rgba(0, 0, 0, ${(flash * 0.08).toFixed(3)})`,
      gameOverOverlay: "rgba(250, 241, 231, 0.72)",
      idleOverlay: "rgba(250, 241, 231, 0.35)",
    }
  }

  return {
    gridDot: "rgba(255, 255, 255, 0.035)",
    foodShadow: "rgba(255, 255, 255, 0.45)",
    food: "rgba(255, 255, 255, 0.95)",
    snakeHead: "#ffffff",
    snakeBody: (alpha: number) => `rgba(255, 255, 255, ${alpha.toFixed(3)})`,
    obstacle: "rgba(255, 255, 255, 0.88)",
    obstacleBorder: "rgba(255, 255, 255, 0.95)",
    eye: "#0a0a0a",
    particle: (life: number) => `rgba(255, 255, 255, ${life})`,
    eatFlash: (flash: number) => `rgba(255, 255, 255, ${(flash * 0.12).toFixed(3)})`,
    gameOverOverlay: "rgba(0, 0, 0, 0.42)",
    idleOverlay: "rgba(0, 0, 0, 0.25)",
  }
}
