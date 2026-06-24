"use client"

import { Moon, Sun } from "lucide-react"

import { useSiteTheme } from "@/components/public/site-theme-provider"
import { cn } from "@/lib/utils"

type ThemeToggleProps = {
  className?: string
  variant?: "dock" | "sheet"
}

export function ThemeToggle({ className, variant = "dock" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useSiteTheme()
  const isLight = theme === "light"
  const label = isLight ? "Switch to dark mode" : "Switch to light mode"

  if (variant === "sheet") {
    return (
      <div
        className={cn(
          "flex min-h-12 items-center justify-between px-3",
          className
        )}
      >
        <span className="text-[0.9375rem] text-muted-foreground">
          Appearance
        </span>
        <button
          aria-label={label}
          aria-pressed={!isLight}
          className="inline-flex shrink-0 items-center gap-2 border-0 bg-transparent p-0"
          onClick={toggleTheme}
          type="button"
        >
          <Sun
            aria-hidden
            className={cn(
              "size-3.5 shrink-0 text-foreground",
              !isLight && "text-muted-foreground/50"
            )}
          />
          <span className="relative inline-flex h-6 w-11 shrink-0 rounded-full border border-border/70 bg-muted/60">
            <span
              className={cn(
                "absolute top-1/2 size-[1.125rem] -translate-y-1/2 rounded-full bg-foreground transition-[left] duration-200",
                isLight ? "left-0.5" : "left-[calc(100%-1.125rem-0.125rem)]"
              )}
            />
          </span>
          <Moon
            aria-hidden
            className={cn(
              "size-3.5 shrink-0 text-foreground",
              isLight && "text-muted-foreground/50"
            )}
          />
        </button>
      </div>
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
        {isLight ? (
          <Moon className="h-[18px] w-[18px]" />
        ) : (
          <Sun className="h-[18px] w-[18px]" />
        )}
      </span>
      <span className="dock-item-label">
        {isLight ? "Dark mode" : "Light mode"}
      </span>
    </button>
  )
}
