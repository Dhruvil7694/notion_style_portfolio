import { format, formatDistanceToNow, isValid, parseISO } from "date-fns"

export function toDate(value: Date | string | number): Date {
  if (value instanceof Date) {
    return value
  }

  if (typeof value === "number") {
    return new Date(value)
  }

  const parsed = parseISO(value)
  if (isValid(parsed)) {
    return parsed
  }

  const fallback = new Date(value)
  if (isValid(fallback)) {
    return fallback
  }

  throw new RangeError(`Invalid date value: ${value}`)
}

export function formatDate(
  value: Date | string | number,
  pattern = "MMMM d, yyyy"
): string {
  return format(toDate(value), pattern)
}

export function formatRelativeDate(value: Date | string | number): string {
  return formatDistanceToNow(toDate(value), { addSuffix: true })
}

export function formatDateTime(
  value: Date | string | number,
  pattern = "MMMM d, yyyy 'at' h:mm a"
): string {
  return format(toDate(value), pattern)
}

export function formatDateRange(
  start: string | null,
  end: string | null,
  pattern = "MMM yyyy"
): string {
  if (!start) {
    return "—"
  }

  const startLabel = formatDate(start, pattern)
  const endLabel = end ? formatDate(end, pattern) : "Present"

  return `${startLabel} – ${endLabel}`
}
