import { cn } from "@/shared/lib/utils"

type AdminPanelProps = {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function AdminPanel({
  title,
  description,
  actions,
  children,
  className,
}: AdminPanelProps) {
  return (
    <section
      className={cn(
        "border-border/60 bg-card/50 space-y-6 rounded-xl border p-6 shadow-md",
        className
      )}
    >
      {title || description || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            {title ? (
              <h2 className="text-base font-semibold tracking-tight">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

type AdminDataTableProps = {
  children: React.ReactNode
  className?: string
}

export function AdminDataTable({ children, className }: AdminDataTableProps) {
  return (
    <div
      className={cn(
        "border-border/60 overflow-hidden rounded-lg border bg-card/40 shadow-sm",
        className
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

type AdminCalloutProps = {
  title?: string
  children: React.ReactNode
  variant?: "default" | "warning" | "error"
  className?: string
}

export function AdminCallout({
  title,
  children,
  variant = "default",
  className,
}: AdminCalloutProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 text-sm shadow-sm",
        variant === "default" &&
          "border-border/60 bg-card/40 text-muted-foreground",
        variant === "warning" &&
          "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200",
        variant === "error" &&
          "border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-200",
        className
      )}
    >
      {title ? (
        <p className="text-foreground mb-2 font-medium">{title}</p>
      ) : null}
      <div className="space-y-1">{children}</div>
    </div>
  )
}
