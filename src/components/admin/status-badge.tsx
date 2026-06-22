import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  published: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  draft: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  archived: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  inactive: "bg-muted text-muted-foreground",
}

type StatusBadgeProps = {
  value: string
  className?: string
}

export function StatusBadge({ value, className }: StatusBadgeProps) {
  const normalized = value.toLowerCase()

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium capitalize",
        statusStyles[normalized] ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {value.replaceAll("_", " ")}
    </span>
  )
}
