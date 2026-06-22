import { cn } from "@/lib/utils"

const inputClassName =
  "border-input bg-background focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"

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
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium" htmlFor={name}>
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      {error ? (
        <p className="text-destructive text-xs" id={`${name}-error`} role="alert">
          {error}
        </p>
      ) : null}
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
      className={cn(inputClassName, "min-h-24 resize-y", className)}
      {...props}
    />
  )
}

type SelectInputProps = React.SelectHTMLAttributes<HTMLSelectElement>

export function SelectInput({ className, children, ...props }: SelectInputProps) {
  return (
    <select className={cn(inputClassName, className)} {...props}>
      {children}
    </select>
  )
}

export { inputClassName }
