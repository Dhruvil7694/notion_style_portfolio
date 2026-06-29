import { differenceInMonths, max, parseISO } from "date-fns"

import { isVolunteerExperience } from "@/features/portfolio/lib/experience-duration"
import type { Experience } from "@/shared/types/database.helpers"

type DateRange = {
  start: Date
  end: Date
}

type ExperienceRangeFields = Pick<
  Experience,
  "start_date" | "end_date" | "role"
>

function getJobRange(experience: ExperienceRangeFields): DateRange {
  return {
    start: parseISO(experience.start_date),
    end: experience.end_date ? parseISO(experience.end_date) : new Date(),
  }
}

function mergeRanges(ranges: DateRange[]): DateRange[] {
  if (ranges.length === 0) {
    return []
  }

  const sorted = [...ranges].sort(
    (left, right) => left.start.getTime() - right.start.getTime()
  )
  const first = sorted[0]
  if (!first) {
    return []
  }

  const merged: DateRange[] = [{ start: first.start, end: first.end }]

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index]
    const last = merged[merged.length - 1]
    if (!current || !last) {
      continue
    }

    if (current.start <= last.end) {
      last.end = max([last.end, current.end])
    } else {
      merged.push({ start: current.start, end: current.end })
    }
  }

  return merged
}

function monthsInRange(range: DateRange): number {
  return Math.max(1, differenceInMonths(range.end, range.start) + 1)
}

function formatDuration(totalMonths: number): string {
  if (totalMonths < 12) {
    return `${totalMonths} month${totalMonths === 1 ? "" : "s"}`
  }

  const years = totalMonths / 12

  if (years < 2) {
    const rounded = Math.round(years * 10) / 10
    return `~${rounded} years`
  }

  return `${Math.round(years)} years`
}

function extractDomainFromTitle(title: string): string {
  const cleaned = title
    .replace(/\s*&\s*.+$/i, "")
    .replace(
      /\s+(Engineer|Developer|Designer|Researcher|Manager|Architect|Lead|Intern|Builder)$/i,
      ""
    )
    .trim()

  return cleaned || title
}

function getCurrentExperience(experiences: Experience[]): Experience | null {
  const current = experiences.find((entry) => !entry.end_date)
  if (current) {
    return current
  }

  return (
    [...experiences].sort(
      (left, right) =>
        parseISO(right.start_date).getTime() -
        parseISO(left.start_date).getTime()
    )[0] ?? null
  )
}

export function buildExperienceSummary(
  experiences: Experience[],
  ownerTitle?: string | null
): string | null {
  if (experiences.length === 0) {
    return null
  }

  const mergedRanges = mergeRanges(experiences.map(getJobRange))
  const totalMonths = mergedRanges.reduce(
    (total, range) => total + monthsInRange(range),
    0
  )
  const domain = extractDomainFromTitle(ownerTitle ?? "Engineering")
  const totalLabel = formatDuration(totalMonths)

  const current = getCurrentExperience(experiences)
  if (!current) {
    return `${totalLabel} in ${domain}`
  }

  const currentMonths = monthsInRange(getJobRange(current))
  const currentLabel = formatDuration(currentMonths)

  return `${totalLabel} in ${domain}, ${currentLabel} in ${current.company}`
}

export function getTotalExperienceMonths(
  experiences: ExperienceRangeFields[]
): number {
  return mergeRanges(experiences.map(getJobRange)).reduce(
    (total, range) => total + monthsInRange(range),
    0
  )
}

export function getTotalExperienceMonthsExcludingVolunteer(
  experiences: ExperienceRangeFields[]
): number {
  return getTotalExperienceMonths(
    experiences.filter((entry) => !isVolunteerExperience(entry))
  )
}

export function getVolunteerExperienceMonths(
  experiences: ExperienceRangeFields[]
): number {
  return getTotalExperienceMonths(
    experiences.filter((entry) => isVolunteerExperience(entry))
  )
}

export function getCurrentCompanyMonths(
  experiences: Experience[]
): number | null {
  const current = getCurrentExperience(experiences)
  if (!current) {
    return null
  }

  return monthsInRange(getJobRange(current))
}
