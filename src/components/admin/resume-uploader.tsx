"use client"

import { CheckCircle2, Loader2, Upload, XCircle } from "lucide-react"
import { useRef, useState } from "react"

import { uploadResumePdf } from "@/lib/admin/actions/uploads"
import { cn } from "@/lib/utils"

type Props = { activeUrl: string | null }
type State = "idle" | "uploading" | "done" | "error"

export function ResumeUploader({ activeUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<State>("idle")
  const [error, setError] = useState<string | null>(null)
  const [newUrl, setNewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  async function handleFile(file: File) {
    if (!file) return
    setState("uploading")
    setError(null)

    const fd = new FormData()
    fd.append("file", file)

    const result = await uploadResumePdf(fd)
    if (result.success) {
      setNewUrl(result.data.url)
      setState("done")
    } else {
      setError(result.error)
      setState("error")
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-colors",
          isDragging
            ? "border-foreground/40 bg-muted/30"
            : "border-border/50 bg-muted/10 hover:border-border/80 hover:bg-muted/20",
          state === "uploading" && "pointer-events-none opacity-60"
        )}
        onClick={() => inputRef.current?.click()}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          accept="application/pdf"
          className="hidden"
          onChange={onInputChange}
          type="file"
        />

        {state === "uploading" ? (
          <Loader2 className="size-7 animate-spin text-muted-foreground/50" />
        ) : state === "done" ? (
          <CheckCircle2 className="size-7 text-green-500" />
        ) : (
          <Upload className="size-7 text-muted-foreground/40" />
        )}

        <div className="text-center">
          {state === "done" ? (
            <p className="text-[13px] font-medium text-green-600 dark:text-green-400">
              Uploaded successfully
            </p>
          ) : state === "uploading" ? (
            <p className="text-[13px] text-muted-foreground/60">Uploading…</p>
          ) : (
            <>
              <p className="text-[13px] font-medium text-foreground/80">
                Drop PDF here or click to browse
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground/50">Max 10 MB · PDF only</p>
            </>
          )}
        </div>

        {state === "done" && (
          <button
            className="text-[11px] text-muted-foreground/60 underline-offset-2 hover:text-foreground hover:underline"
            onClick={(e) => { e.stopPropagation(); setState("idle"); setNewUrl(null) }}
            type="button"
          >
            Upload another version
          </button>
        )}
      </div>

      {state === "error" && error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2.5">
          <XCircle className="size-4 shrink-0 text-red-500" />
          <p className="text-[12px] text-red-600">{error}</p>
        </div>
      )}

      {/* Quick preview of newly uploaded */}
      {state === "done" && newUrl && (
        <div className="overflow-hidden rounded-xl border border-green-500/20">
          <div className="border-b border-green-500/10 bg-green-500/5 px-4 py-2">
            <p className="text-[11px] font-medium text-green-600 dark:text-green-400">
              New active resume
            </p>
          </div>
          <object
            className="h-[400px] w-full"
            data={`${newUrl}#toolbar=0&navpanes=0&view=FitH`}
            type="application/pdf"
          >
            <div className="flex h-[400px] items-center justify-center bg-muted/10">
              <a
                className="text-sm underline underline-offset-2"
                href={newUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Open PDF
              </a>
            </div>
          </object>
        </div>
      )}

      {/* Show current active if no new upload yet */}
      {state === "idle" && activeUrl && (
        <p className="text-[11px] text-muted-foreground/50">
          Current active:{" "}
          <a
            className="underline underline-offset-2 hover:text-foreground"
            href={activeUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            view PDF
          </a>
        </p>
      )}
    </div>
  )
}
