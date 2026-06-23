export {
  buildJobFitPdfFilename,
  buildJobFitPdfReportData,
  type JobFitPdfReportData,
} from "@/lib/public/job-fit-pdf/report-data"

export async function requestJobFitPdfExport(
  analysisMarkdown: string
): Promise<{ ok: true; filename: string } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/job-fit/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisMarkdown }),
    })

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string }
      return {
        ok: false,
        error: payload.error ?? "Couldn't export PDF. Try again shortly.",
      }
    }

    const blob = await res.blob()
    const disposition = res.headers.get("Content-Disposition") ?? ""
    const match = disposition.match(/filename="([^"]+)"/i)
    const filename = match?.[1] ?? "job-fit-report.pdf"
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)

    return { ok: true, filename }
  } catch {
    return {
      ok: false,
      error: "Couldn't export PDF. Check your connection and retry.",
    }
  }
}
