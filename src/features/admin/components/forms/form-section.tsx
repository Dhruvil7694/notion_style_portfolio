import { cn } from "@/shared/lib/utils"

/** Standard two-column field grid spacing for admin forms. */
export const adminFormGridClass = "grid gap-x-8 gap-y-10 md:grid-cols-2"

/** Standard three-column field grid spacing for admin forms. */
export const adminFormGridThreeClass = "grid gap-x-8 gap-y-10 md:grid-cols-3"

/** Vertical stack spacing between full-width fields in a section. */
export const adminFormStackClass = "flex flex-col gap-y-10"

type FormSectionProps = {
  title: string
  description?: string
  children: React.ReactNode
  variant?: "plain" | "card"
  className?: string
}

export function FormSection({
  title,
  description,
  children,
  variant = "plain",
  className,
}: FormSectionProps) {
  return (
    <section
      className={cn(
        variant === "card"
          ? "border-border/60 bg-card/50 space-y-8 rounded-xl border p-7 shadow-md"
          : "border-border space-y-8 border-t pt-8 first:border-t-0 first:pt-0",
        className
      )}
    >
      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      <div className={adminFormStackClass}>{children}</div>
    </section>
  )
}
