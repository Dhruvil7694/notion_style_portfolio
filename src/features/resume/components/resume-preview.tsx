"use client"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

import { Download } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"

import { captureEvent } from "@/shared/lib/analytics/posthog-client"
import { cn } from "@/shared/lib/utils"

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

type Props = {
  fileUrl: string
  downloadUrl: string
}

export function ResumePreview({ fileUrl, downloadUrl }: Props) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    function measure() {
      const el = document.getElementById("resume-preview-container")
      if (el) setWidth(el.clientWidth)
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  return (
    <div className="resume-preview-shell relative overflow-hidden rounded-2xl border border-border/40 bg-background shadow-sm">
      <div id="resume-preview-container" className="w-full">
        <Document
          file={fileUrl}
          loading={
            <div className="flex h-[500px] items-center justify-center bg-muted/10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground/60" />
            </div>
          }
          error={
            <div className="flex h-[400px] flex-col items-center justify-center gap-3 bg-muted/10">
              <p className="text-sm text-muted-foreground">
                Preview unavailable
              </p>
              <Link
                className="text-sm underline underline-offset-2 hover:text-foreground"
                href={downloadUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open PDF directly
              </Link>
            </div>
          }
        >
          <Page
            pageNumber={1}
            width={width || undefined}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="block"
          />
        </Document>
      </div>

      {/* Frosted fade — bottom half, matches page background */}
      <div aria-hidden className="resume-preview-fade" />

      {/* Download CTA in fade zone */}
      <div className="resume-preview-cta absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 pb-10">
        <p className="text-[13px] text-muted-foreground/70">
          Download the full resume to read more
        </p>
        <Link
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl bg-foreground px-5 py-2.5",
            "text-[13px] font-semibold text-background shadow-lg transition-opacity hover:opacity-80"
          )}
          href={downloadUrl}
          onClick={() =>
            captureEvent("resume_download", { source: "resume_page" })
          }
          rel="noopener noreferrer"
          target="_blank"
        >
          <Download className="size-4" />
          Download Resume
        </Link>
      </div>
    </div>
  )
}
