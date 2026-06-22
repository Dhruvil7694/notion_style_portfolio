import { DataTable, PageHeader, StatusBadge } from "@/components/admin"
import { ResumeUploader } from "@/components/admin/resume-uploader"
import { getResumesList } from "@/lib/admin/queries"
import { formatDateTime } from "@/lib/utils"

export const metadata = {
  title: "Resume",
  robots: { index: false, follow: false },
}

export default async function AdminResumePage() {
  const { data: resumes, error } = await getResumesList()
  const active = resumes?.find((r) => r.is_active)

  return (
    <div className="space-y-8">
      <PageHeader
        description="Upload a new PDF to replace the active resume. The latest upload is shown publicly."
        title="Resume"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <ResumeUploader activeUrl={active?.file_path ?? null} />

        {active?.file_path && (
          <div className="overflow-hidden rounded-xl border border-border/40 bg-muted/10">
            <div className="flex items-center justify-between border-b border-border/30 px-4 py-2.5">
              <p className="text-[12px] font-medium text-muted-foreground">
                Active — v{active.version}
              </p>
              <a
                className="text-[11px] text-muted-foreground/60 underline-offset-2 hover:text-foreground hover:underline"
                href={active.file_path}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open PDF
              </a>
            </div>
            <object
              className="h-[600px] w-full"
              data={`${active.file_path}#toolbar=0&navpanes=0&view=FitH`}
              type="application/pdf"
            >
              <div className="flex h-[600px] items-center justify-center bg-muted/10">
                <a
                  className="text-sm underline underline-offset-2 hover:text-foreground"
                  href={active.file_path}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Open PDF directly
                </a>
              </div>
            </object>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Version history</h2>
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            Unable to load resumes: {error.message}
          </p>
        ) : (
          <DataTable
            columns={[
              {
                key: "version",
                header: "Version",
                cell: (row) => <span className="font-medium">v{row.version}</span>,
              },
              {
                key: "status",
                header: "Status",
                cell: (row) => (
                  <StatusBadge value={row.is_active ? "active" : "inactive"} />
                ),
              },
              {
                key: "uploaded_at",
                header: "Uploaded At",
                cell: (row) => formatDateTime(row.uploaded_at),
              },
              {
                key: "file_path",
                header: "File",
                cell: (row) => (
                  <a
                    className="text-[12px] text-muted-foreground/60 underline-offset-2 hover:text-foreground hover:underline"
                    href={row.file_path}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    View
                  </a>
                ),
              },
            ]}
            emptyDescription="Upload a PDF above to get started."
            emptyTitle="No resume versions yet."
            getRowKey={(row) => row.id}
            rows={resumes ?? []}
          />
        )}
      </div>
    </div>
  )
}
