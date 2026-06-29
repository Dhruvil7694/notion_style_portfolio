import { cn } from "@/shared/lib/utils"

type PageLoadingShellProps = {
  className?: string
  rows?: number
}

export function PageLoadingShell({
  className,
  rows = 6,
}: PageLoadingShellProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading page"
      className={cn(
        "kb-page mx-auto max-w-home animate-pulse px-page pb-kb-section",
        className
      )}
    >
      <div className="mb-kb-heading space-y-3">
        <div className="h-3 w-28 rounded bg-[color-mix(in_srgb,var(--foreground)_12%,transparent)]" />
        <div className="h-9 w-48 max-w-full rounded bg-[color-mix(in_srgb,var(--foreground)_14%,transparent)]" />
        <div className="h-4 w-full max-w-xl rounded bg-[color-mix(in_srgb,var(--foreground)_10%,transparent)]" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            className="h-16 rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
            key={index}
          />
        ))}
      </div>
    </div>
  )
}
