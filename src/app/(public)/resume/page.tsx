import { Download } from "lucide-react"
import Link from "next/link"

import { PageShell } from "@/features/knowledge-base/components/content-shell"
import {
  getActiveResume,
  getPublicSettings,
} from "@/features/portfolio/lib/queries"
import { ResumePreviewLazy } from "@/features/resume/components/resume-preview-lazy"
import { PublicEmptyState } from "@/features/site-shell/components/empty-state"
import { formatDate } from "@/shared/lib/utils/date"
import { createPageMetadata } from "@/shared/lib/utils/metadata"

export async function generateMetadata() {
  const settings = await getPublicSettings()

  return createPageMetadata({
    title: "Resume",
    description: `Resume for ${settings.site.owner_name || settings.site.site_name}.`,
    path: "/resume",
    siteName: settings.site.site_name,
    siteUrl: settings.site.site_url,
  })
}

export default async function ResumePage() {
  const resume = await getActiveResume()

  return (
    <PageShell
      description="Current resume and professional summary."
      title="Resume"
    >
      {resume?.file_path ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Version {resume.version}
              {resume.uploaded_at
                ? ` · Updated ${formatDate(resume.uploaded_at, "MMMM d, yyyy")}`
                : ""}
            </p>
            <Link
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3.5 py-2 text-[12px] font-medium text-background transition-opacity hover:opacity-80"
              href={resume.file_path}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Download className="size-3.5" />
              Download PDF
            </Link>
          </div>

          <ResumePreviewLazy
            downloadUrl={resume.file_path}
            fileUrl={resume.file_path}
          />
        </div>
      ) : (
        <PublicEmptyState message="Resume will be available here once uploaded." />
      )}
    </PageShell>
  )
}
