"use client"

import { Moon, Sun } from "lucide-react"

import { useSiteTheme } from "@/features/site-shell/components/site-theme-provider"
import { cn } from "@/shared/lib/utils"
import { AnimatedThemeToggler } from "@/shared/ui/animated-theme-toggler"

type ThemeToggleProps = {
  className?: string
  variant?: "dock" | "sheet" | "admin-sidebar" | "admin-settings"
}

export function ThemeToggle({ className, variant = "dock" }: ThemeToggleProps) {
  const { theme, setTheme } = useSiteTheme()
  const isLight = theme === "light"
  const isDark = theme === "dark"
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
        <AnimatedThemeToggler
          aria-label={label}
          className="inline-flex size-10 items-center justify-center rounded-lg border border-border/70 bg-muted/60 text-foreground transition-colors hover:bg-muted [&_svg]:size-[1.125rem]"
          onThemeChange={setTheme}
          theme={theme}
        />
      </div>
    )
  }

  if (variant === "admin-sidebar") {
    return (
      <AnimatedThemeToggler
        aria-label={label}
        className={cn(
          "text-muted-foreground hover:bg-muted/60 hover:text-foreground flex size-7 shrink-0 items-center justify-center rounded-md transition-colors [&_svg]:size-3.5",
          className
        )}
        onThemeChange={setTheme}
        theme={theme}
        title={isDark ? "Light mode" : "Dark mode"}
      />
    )
  }

  if (variant === "admin-settings") {
    return (
      <div className={cn("flex items-center justify-between", className)}>
        <div className="flex items-center gap-2.5">
          {isDark ? (
            <Moon aria-hidden className="text-muted-foreground size-4" />
          ) : (
            <Sun aria-hidden className="text-muted-foreground size-4" />
          )}
          <span className="text-[0.9375rem] font-medium">
            {isDark ? "Dark" : "Light"}
          </span>
        </div>
        <AnimatedThemeToggler
          aria-label={label}
          className="inline-flex size-10 items-center justify-center rounded-lg border border-border/70 bg-muted/60 text-foreground transition-colors hover:bg-muted [&_svg]:size-[1.125rem]"
          onThemeChange={setTheme}
          theme={theme}
        />
      </div>
    )
  }

  return (
    <AnimatedThemeToggler
      aria-label={label}
      className={cn(
        "dock-item group relative flex items-center transition-[background-color,color] duration-150 ease-out [&_svg]:size-[18px]",
        className
      )}
      label={isLight ? "Dark mode" : "Light mode"}
      onThemeChange={setTheme}
      theme={theme}
    />
  )
}
