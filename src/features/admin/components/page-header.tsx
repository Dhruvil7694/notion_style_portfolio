import { cn } from "@/shared/lib/utils"

type PageHeaderProps = {
  title: string
  description: string
  className?: string
  actions?: React.ReactNode
  icon?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  className,
  actions,
  icon,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-4",
        className
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          {icon ? <span className="text-muted-foreground">{icon}</span> : null}
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        </div>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </header>
  )
}
