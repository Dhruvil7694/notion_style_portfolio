import { differenceInMonths, parseISO } from "date-fns"

import { formatDate } from "@/lib/utils/date"
import type { Experience } from "@/types/database.helpers"

type ExperienceDateFields = Pick<Experience, "start_date" | "end_date">
type ExperienceRoleFields = Pick<Experience, "role">

export function isVolunteerExperience(item: ExperienceRoleFields): boolean {
  return /\bvolunteer\b/i.test(item.role)
}

export function getExperienceEndDate(endDate: string | null): Date {
  return endDate ? parseISO(endDate) : new Date()
}

export function getExperienceDurationMonths(item: ExperienceDateFields): number {
  const start = parseISO(item.start_date)
  const end = getExperienceEndDate(item.end_date)

  return Math.max(1, differenceInMonths(end, start) + 1)
}

export function formatExperienceDurationCompact(totalMonths: number): string {
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  if (years === 0) {
    return `${months} mo${months === 1 ? "" : "s"}`
  }

  if (months === 0) {
    return `${years} yr${years === 1 ? "" : "s"}`
  }

  return `${years} yr${years === 1 ? "" : "s"} ${months} mo${months === 1 ? "" : "s"}`
}

export function formatExperienceDateRangeLabel(
  startDate: string,
  endDate: string | null
): string {
  const startLabel = formatDate(startDate, "yyyy.MM")
  const endLabel = endDate ? formatDate(endDate, "yyyy.MM") : "Present"

  return `${startLabel} – ${endLabel}`
}

function formatProfessionalYearsLabel(totalMonths: number): string {
  if (totalMonths < 12) {
    return `${totalMonths} mo${totalMonths === 1 ? "" : "s"}`
  }

  const years = Math.round((totalMonths / 12) * 10) / 10

  return `~${years} year${years === 1 ? "" : "s"}`
}

export function formatExperienceHeaderTotal(
  professionalMonths: number,
  volunteerMonths: number
): string {
  const professionalLabel = formatProfessionalYearsLabel(professionalMonths)

  if (volunteerMonths <= 0) {
    return professionalLabel
  }

  return `${professionalLabel} + ${volunteerMonths} month${volunteerMonths === 1 ? "" : "s"} volunteer`
}

export function buildExperienceCompanyLine(
  item: Pick<Experience, "company" | "location">
): string {
  const location = item.location?.trim()

  return [item.company, location].filter(Boolean).join(" · ")
}
