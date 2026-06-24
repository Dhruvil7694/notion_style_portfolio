"use client"

import dynamic from "next/dynamic"

import { PageLoadingShell } from "@/components/public/page-loading-shell"

const ResumePreviewImpl = dynamic(
  () =>
    import("@/components/public/resume-preview").then((module) => ({
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
