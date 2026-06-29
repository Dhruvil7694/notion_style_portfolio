export const SENIORITY_LEVELS = [
  "intern",
  "junior",
  "mid",
  "senior",
  "staff",
  "lead",
  "unknown",
] as const

export type SeniorityLevel = (typeof SENIORITY_LEVELS)[number]

export type JdSeniorityMeta = {
  seniority: SeniorityLevel
  yearsExperienceMin: number | null
  yearsExperienceMax: number | null
}

export type JobFitSubmissionMeta = {
  roleTitle?: string | null
  seniority?: SeniorityLevel
  yearsExperienceMin?: number | null
  yearsExperienceMax?: number | null
}

const SENIORITY_LABELS: Record<SeniorityLevel, string> = {
  intern: "Intern",
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  staff: "Staff / Principal",
  lead: "Lead / Manager",
  unknown: "Not stated",
}

export function isSeniorityLevel(value: string): value is SeniorityLevel {
  return (SENIORITY_LEVELS as readonly string[]).includes(value)
}

export function formatSeniorityLabel(level: SeniorityLevel): string {
  return SENIORITY_LABELS[level]
}

export function formatExperienceRange(
  min: number | null | undefined,
  max: number | null | undefined
): string | null {
  const lo = min ?? null
  const hi = max ?? null

  if (lo === null && hi === null) return null
  if (lo !== null && hi !== null) {
    if (lo === hi) return `${lo} yr${lo === 1 ? "" : "s"}`
    return `${lo}–${hi} yrs`
  }
  if (lo !== null) return `${lo}+ yrs`
  if (hi !== null) return `up to ${hi} yrs`
  return null
}

export function formatSeniorityHint(meta: JdSeniorityMeta): string {
  const label = formatSeniorityLabel(meta.seniority)
  const years = formatExperienceRange(
    meta.yearsExperienceMin,
    meta.yearsExperienceMax
  )

  if (meta.seniority === "unknown") {
    return years ? `Experience: ${years}` : "Seniority not stated in JD"
  }

  return years ? `${label} · ${years}` : label
}

export function formatJdClassifierContext(meta: JobFitSubmissionMeta): string {
  const lines: string[] = []

  if (meta.roleTitle?.trim()) {
    lines.push(`Detected role title: ${meta.roleTitle.trim()}`)
  }

  if (meta.seniority && meta.seniority !== "unknown") {
    lines.push(`Detected seniority: ${meta.seniority}`)
  }

  const years = formatExperienceRange(
    meta.yearsExperienceMin,
    meta.yearsExperienceMax
  )
  if (years) {
    lines.push(`Stated experience: ${years}`)
  }

  if (lines.length === 0) return ""

  return `\n\n[JD classifier context — use for seniority calibration]\n${lines.join("\n")}`
}

export type ParsedSeniorityFit = {
  roleLevel: string
  profileLevel: string
  verdict: string
}

const SENIORITY_FIT_SECTION = /###\s*🎯?\s*Seniority fit/i

export function parseSeniorityFit(markdown: string): ParsedSeniorityFit | null {
  const match = markdown.match(SENIORITY_FIT_SECTION)
  if (!match?.index && match?.index !== 0) return null

  const start = match.index + match[0].length
  const rest = markdown.slice(start)
  const nextHeader = rest.search(/\n###\s/)
  const section =
    nextHeader === -1 ? rest.trim() : rest.slice(0, nextHeader).trim()

  const roleLevel = section.match(/\*\*Role level:\*\*\s*(.+)/i)?.[1]?.trim()
  const profileLevel = section
    .match(/\*\*Dhruvil's profile:\*\*\s*(.+)/i)?.[1]
    ?.trim()
  const verdict = section.match(/\*\*Verdict:\*\*\s*(.+)/i)?.[1]?.trim()

  if (!roleLevel && !verdict) return null

  return {
    roleLevel: roleLevel ?? "",
    profileLevel: profileLevel ?? "",
    verdict: verdict ?? "",
  }
}
