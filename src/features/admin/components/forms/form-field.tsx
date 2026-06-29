import { cn } from "@/shared/lib/utils"

const inputClassName =
  "admin-form-control border-border/70 bg-card text-foreground focus-visible:ring-ring/50 min-h-11 w-full rounded-lg border px-4 py-3 text-[0.9375rem] outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"

type FormFieldProps = {
  label: string
  name: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  name,
  error,
  hint,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("flex w-full flex-col items-stretch gap-4", className)}>
      <label
        className="block w-full px-4 text-left text-[0.9375rem] font-medium leading-none"
        htmlFor={name}
      >
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </label>
      <div className="flex w-full min-w-0 flex-col items-stretch gap-1.5">
        <div className="w-full min-w-0">{children}</div>
        {hint ? (
          <p className="text-muted-foreground w-full px-4 text-left text-xs">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p
            className="text-destructive w-full px-4 text-left text-xs"
            id={`${name}-error`}
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

type TextInputProps = React.InputHTMLAttributes<HTMLInputElement>

export function TextInput({ className, ...props }: TextInputProps) {
  return <input className={cn(inputClassName, className)} {...props} />
}

type TextAreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export function TextArea({ className, ...props }: TextAreaProps) {
  return (
    <textarea
      className={cn(inputClassName, "min-h-28 resize-y", className)}
      {...props}
    />
  )
}

type SelectInputProps = React.SelectHTMLAttributes<HTMLSelectElement>

export function SelectInput({
  className,
  children,
  ...props
}: SelectInputProps) {
  return (
    <select className={cn(inputClassName, className)} {...props}>
      {children}
    </select>
  )
}

export { inputClassName }
