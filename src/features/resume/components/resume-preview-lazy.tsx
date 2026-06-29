"use client"

import dynamic from "next/dynamic"

import { PageLoadingShell } from "@/features/site-shell/components/page-loading-shell"

const ResumePreviewImpl = dynamic(
  () =>
    import("@/features/resume/components/resume-preview").then((module) => ({
      default: module.ResumePreview,
    })),
  {
    ssr: false,
    loading: () => <PageLoadingShell rows={6} />,
  }
)

type ResumePreviewLazyProps = {
  downloadUrl: string
  fileUrl: string
}

export function ResumePreviewLazy({
  downloadUrl,
  fileUrl,
}: ResumePreviewLazyProps) {
  return <ResumePreviewImpl downloadUrl={downloadUrl} fileUrl={fileUrl} />
}
