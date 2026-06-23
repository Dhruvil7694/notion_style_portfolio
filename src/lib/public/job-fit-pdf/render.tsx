import "server-only"

import { renderToBuffer } from "@react-pdf/renderer"

import { JobFitPdfDocument } from "@/lib/public/job-fit-pdf/document"
import {
  buildJobFitPdfReportData,
  type JobFitPdfReportData,
} from "@/lib/public/job-fit-pdf/report-data"

export async function renderJobFitPdfBuffer(
  analysisMarkdown: string,
  ownerName: string
): Promise<{ data: JobFitPdfReportData; buffer: Buffer } | null> {
  const data = buildJobFitPdfReportData(analysisMarkdown, ownerName)
  if (!data) return null

  const buffer = await renderToBuffer(<JobFitPdfDocument data={data} />)
  return { data, buffer }
}
