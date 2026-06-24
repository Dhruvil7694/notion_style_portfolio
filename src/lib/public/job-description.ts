const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".text", ".md"] as const
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
])

export const JOB_DESCRIPTION_MAX_BYTES = 2 * 1024 * 1024
export const JOB_DESCRIPTION_MAX_CHARS = 80_000

export type {
  JdClassificationFeedbackPayload,
  JobDescriptionValidationResult,
} from "@/lib/public/job-description-validation"
export {
  hashJobDescriptionContent,
  reportJdClassificationFeedback,
  validateJobDescriptionText,
} from "@/lib/public/job-description-validation"

export function isAllowedJobDescriptionFile(file: File): boolean {
  const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? ""
  if (ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    return true
  }
  return ALLOWED_MIME_TYPES.has(file.type)
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist")
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

  const buffer = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buffer }).promise
  const chunks: string[] = []

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => {
        if (!("str" in item) || !item.str) return ""
        return item.hasEOL ? `${item.str}\n` : `${item.str} `
      })
      .join("")
    chunks.push(pageText.replace(/\s+\n/g, "\n").trim())
  }

  return chunks.filter(Boolean).join("\n\n")
}

export async function extractTextFromJobDescriptionFile(
  file: File
): Promise<{ text: string } | { error: string }> {
  if (!isAllowedJobDescriptionFile(file)) {
    return {
      error:
        "Unsupported file type. Please upload a PDF or text file (.pdf, .txt).",
    }
  }

  if (file.size > JOB_DESCRIPTION_MAX_BYTES) {
    return {
      error: "File is too large. Please upload a job description under 2 MB.",
    }
  }

  try {
    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? ""
    const text =
      ext === ".pdf" || file.type === "application/pdf"
        ? await extractPdfText(file)
        : await file.text()

    const trimmed = text.replace(/\s+/g, " ").trim()
    if (trimmed.length < 40) {
      return {
        error:
          "Couldn't read text from this PDF. It may be a scanned image — try pasting the JD as text instead.",
      }
    }

    return { text: text.trim() }
  } catch {
    return {
      error:
        "Couldn't read that file. Please upload a valid job description (.pdf or .txt).",
    }
  }
}

export const JOB_DESCRIPTION_FILE_ACCEPT =
  ".pdf,.txt,.text,.md,application/pdf,text/plain"
