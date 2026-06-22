import { cn } from "@/lib/utils"

type PageHeaderProps = {
  title: string
  description: string
  className?: string
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  className,
  actions,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-4",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  )
}
