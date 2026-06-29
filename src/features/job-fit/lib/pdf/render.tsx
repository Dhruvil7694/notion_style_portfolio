import "server-only"

import { renderToBuffer } from "@react-pdf/renderer"

import { JobFitPdfDocument } from "@/features/job-fit/lib/pdf/document"
import {
  buildJobFitPdfReportData,
  type JobFitPdfReportData,
} from "@/features/job-fit/lib/pdf/report-data"

export async function renderJobFitPdfBuffer(
  analysisMarkdown: string,
  ownerName: string
): Promise<{ data: JobFitPdfReportData; buffer: Buffer } | null> {
  const data = buildJobFitPdfReportData(analysisMarkdown, ownerName)
  if (!data) return null

  const buffer = await renderToBuffer(<JobFitPdfDocument data={data} />)
  return { data, buffer }
}
