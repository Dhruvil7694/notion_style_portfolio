"use client"

import { Moon, Sun } from "lucide-react"

import { useSiteTheme } from "@/components/public/site-theme-provider"
import { cn } from "@/lib/utils"

type ThemeToggleProps = {
  className?: string
  variant?: "dock" | "header"
}

export function ThemeToggle({ className, variant = "dock" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useSiteTheme()
  const isLight = theme === "light"
  const label = isLight ? "Switch to dark mode" : "Switch to light mode"

  if (variant === "header") {
    return (
      <button
        aria-label={label}
        className={cn("kb-nav-link cursor-pointer border-none bg-transparent p-0", className)}
        onClick={toggleTheme}
        type="button"
      >
        {isLight ? "Dark" : "Light"}
      </button>
    )
  }

  return (
    <button
      aria-label={label}
      className={cn(
        "dock-item group relative flex items-center transition-[background-color,color] duration-150 ease-out",
        className
      )}
      onClick={toggleTheme}
      type="button"
    >
      <span className="dock-item-icon">
        {isLight ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
      </span>
      <span className="dock-item-label">{isLight ? "Dark mode" : "Light mode"}</span>
    </button>
  )
}
