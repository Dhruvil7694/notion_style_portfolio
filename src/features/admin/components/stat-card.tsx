import { cn } from "@/shared/lib/utils"

type StatCardProps = {
  label: string
  value: string | number
  hint?: string
  className?: string
}

export function StatCard({ label, value, hint, className }: StatCardProps) {
  return (
    <article
      className={cn(
        "border-border/60 bg-card/40 rounded-lg border p-4 shadow-md",
        className
      )}
    >
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? (
        <p className="text-muted-foreground mt-1 text-xs">{hint}</p>
      ) : null}
    </article>
  )
}
