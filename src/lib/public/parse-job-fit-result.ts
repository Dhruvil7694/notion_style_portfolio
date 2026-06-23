export type ParsedJobFitAnalysis = {
  roleTitle: string
  fitScore: number
  fitScoreLabel: string
}

export type JobFitSkillRow = {
  requirement: string
  detail: string
}

export type DetailedJobFitAnalysis = ParsedJobFitAnalysis & {
  strongMatches: JobFitSkillRow[]
  partialMatches: JobFitSkillRow[]
  growthAreas: JobFitSkillRow[]
  summary: string | null
}

const FIT_ANALYSIS_HEADER = /##\s*Fit Analysis:\s*([^\n*]+)/i
const FIT_SCORE = /overall fit score[:\s*]+(\d+)\s*%/i

const SECTION_STRONG = /###\s*✅?\s*Strong Matches/i
const SECTION_PARTIAL = /###\s*🔶?\s*Partial Matches/i
const SECTION_GROWTH = /###\s*⚡?\s*Growth Areas/i
const SECTION_SUMMARY = /###\s*Summary/i

function parseMarkdownTableRows(section: string): JobFitSkillRow[] {
  const lines = section
    .split("\n")
    .filter((line) => line.trim().startsWith("|"))
  if (lines.length < 2) return []

  return lines
    .slice(2)
    .map((line) => {
      const cells = line
        .split("|")
        .map((cell) => cell.trim().replace(/\*+/g, ""))
        .filter(Boolean)

      const requirement = cells[0] ?? ""
      const detail = cells[1] ?? ""
      if (!requirement || requirement === "---") return null
      return { requirement, detail }
    })
    .filter((row): row is JobFitSkillRow => row !== null)
}

function extractSection(markdown: string, header: RegExp): string {
  const match = markdown.match(header)
  if (!match?.index && match?.index !== 0) return ""

  const start = match.index + match[0].length
  const rest = markdown.slice(start)
  const nextHeader = rest.search(/\n###\s/)
  return nextHeader === -1 ? rest.trim() : rest.slice(0, nextHeader).trim()
}

function extractSummary(markdown: string): string | null {
  const section = extractSection(markdown, SECTION_SUMMARY)
  if (!section) return null

  const text = section
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("|"))
    .join(" ")
    .trim()

  return text || null
}

export function parseJobFitAnalysis(
  markdown: string
): ParsedJobFitAnalysis | null {
  const detailed = parseJobFitAnalysisDetailed(markdown)
  if (!detailed) return null

  return {
    roleTitle: detailed.roleTitle,
    fitScore: detailed.fitScore,
    fitScoreLabel: detailed.fitScoreLabel,
  }
}

export function parseJobFitAnalysisDetailed(
  markdown: string
): DetailedJobFitAnalysis | null {
  const roleMatch = markdown.match(FIT_ANALYSIS_HEADER)
  const scoreMatch = markdown.match(FIT_SCORE)
  if (!roleMatch?.[1] || !scoreMatch?.[1]) return null

  const fitScore = Number.parseInt(scoreMatch[1], 10)
  if (Number.isNaN(fitScore)) return null

  const roleTitle = roleMatch[1].trim().replace(/\*+/g, "").trim()

  if (!roleTitle) return null

  return {
    roleTitle,
    fitScore,
    fitScoreLabel: `${fitScore}%`,
    strongMatches: parseMarkdownTableRows(
      extractSection(markdown, SECTION_STRONG)
    ),
    partialMatches: parseMarkdownTableRows(
      extractSection(markdown, SECTION_PARTIAL)
    ),
    growthAreas: parseMarkdownTableRows(
      extractSection(markdown, SECTION_GROWTH)
    ),
    summary: extractSummary(markdown),
  }
}

export function isJobFitAnalysisMessage(content: string): boolean {
  return (
    /##\s*Fit Analysis:/i.test(content) && /Overall Fit Score/i.test(content)
  )
}
