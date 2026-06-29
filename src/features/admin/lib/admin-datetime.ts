import { format } from "date-fns"

import { formatDateTime, toDate } from "@/shared/lib/utils/date"

/** Fixed patterns — safe for SSR/client hydration (no locale drift). */
export const ADMIN_DATETIME_PATTERN = "dd/MM/yyyy HH:mm:ss"
export const ADMIN_TIME_PATTERN = "HH:mm:ss"
export const ADMIN_SHORT_DATE_PATTERN = "MMM d"

export function formatAdminDateTime(value: Date | string | number): string {
  return formatDateTime(value, ADMIN_DATETIME_PATTERN)
}

export function formatAdminTime(value: Date | string | number): string {
  return formatDateTime(value, ADMIN_TIME_PATTERN)
}

export function formatAdminShortDate(value: Date | string | number): string {
  return format(toDate(value), ADMIN_SHORT_DATE_PATTERN)
}
