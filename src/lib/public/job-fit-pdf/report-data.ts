import {
  type ParsedSeniorityFit,
  parseSeniorityFit,
} from "@/lib/public/job-seniority"
import {
  type DetailedJobFitAnalysis,
  type JobFitSkillRow,
  parseJobFitAnalysisDetailed,
} from "@/lib/public/parse-job-fit-result"

export type JobFitPdfReportData = {
  analysis: DetailedJobFitAnalysis
  seniority: ParsedSeniorityFit | null
  ownerName: string
  generatedAt: string
}

export function buildJobFitPdfFilename(roleTitle: string): string {
  const slug = roleTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)

  const date = new Date().toISOString().slice(0, 10)
  return `job-fit-${slug || "report"}-${date}.pdf`
}

export function buildJobFitPdfReportData(
  analysisMarkdown: string,
  ownerName: string
): JobFitPdfReportData | null {
  const analysis = parseJobFitAnalysisDetailed(analysisMarkdown)
  if (!analysis) return null

  return {
    analysis,
    seniority: parseSeniorityFit(analysisMarkdown),
    ownerName,
    generatedAt: new Date().toLocaleDateString("en-IN", {
      dateStyle: "long",
    }),
  }
}

export type { JobFitSkillRow }
