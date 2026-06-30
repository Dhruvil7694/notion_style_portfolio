"use client"

import { Check, Circle, Mail, MailOpen, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"

import { AdminPagination } from "@/features/admin/components/admin-pagination"
import {
  deleteContactAction,
  markContactReadAction,
  markContactUnreadAction,
} from "@/features/admin/lib/actions/contact"
import { ADMIN_PAGE_SIZE } from "@/features/admin/lib/admin-constants"
import type { AdminContactSubmission } from "@/features/admin/lib/contact-types"
import { cn, formatDateTime } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

function SubmissionRow({ submission }: { submission: AdminContactSubmission }) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const isRead = Boolean(submission.read_at)

  const toggleRead = () => {
    startTransition(async () => {
      if (isRead) {
        await markContactUnreadAction(submission.id)
      } else {
        await markContactReadAction(submission.id)
      }
    })
  }

  const handleDelete = () => {
    if (!confirm("Delete this message? This cannot be undone.")) return
    startTransition(async () => {
      await deleteContactAction(submission.id)
    })
  }

  return (
    <div
      className={cn(
        "group rounded-xl border p-4 transition-colors",
        isRead
          ? "border-border/50 bg-card/30"
          : "border-border/80 bg-card/60 shadow-sm"
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Unread dot */}
        <div className="mt-1 shrink-0">
          {isRead ? (
            <Circle className="size-2 text-muted-foreground/30" />
          ) : (
            <Circle className="size-2 fill-primary text-primary" />
          )}
        </div>

        {/* Main content */}
        <button
          className="min-w-0 flex-1 text-left"
          onClick={() => setExpanded((v) => !v)}
          type="button"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "text-sm font-semibold",
                isRead ? "text-foreground/70" : "text-foreground"
              )}
            >
              {submission.name}
            </span>
            <span className="text-muted-foreground text-xs">
              {submission.email}
            </span>
            {submission.subject ? (
              <span className="text-muted-foreground truncate text-xs">
                — {submission.subject}
              </span>
            ) : null}
          </div>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {formatDateTime(submission.created_at)}
          </p>
          {!expanded ? (
            <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm leading-relaxed">
              {submission.message}
            </p>
          ) : null}
        </button>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            aria-label={isRead ? "Mark unread" : "Mark read"}
            className="size-7 p-0"
            disabled={isPending}
            onClick={toggleRead}
            size="sm"
            title={isRead ? "Mark unread" : "Mark read"}
            variant="ghost"
          >
            {isRead ? (
              <Mail className="size-3.5" />
            ) : (
              <MailOpen className="size-3.5" />
            )}
          </Button>
          <Button
            aria-label="Delete message"
            className="size-7 p-0 text-destructive hover:text-destructive"
            disabled={isPending}
            onClick={handleDelete}
            size="sm"
            title="Delete"
            variant="ghost"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Expanded body */}
      {expanded ? (
        <div className="ml-5 mt-3">
          <p className="bg-muted/40 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap">
            {submission.message}
          </p>
          <div className="mt-2 flex gap-2">
            <a
              className="text-primary text-xs hover:underline"
              href={`mailto:${submission.email}?subject=Re: ${encodeURIComponent(submission.subject ?? "Your message")}`}
            >
              Reply via email
            </a>
            {!isRead ? (
              <button
                className="text-muted-foreground flex items-center gap-1 text-xs hover:text-foreground"
                disabled={isPending}
                onClick={toggleRead}
                type="button"
              >
                <Check className="size-3" />
                Mark as read
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function ContactInbox({
  submissions,
  total,
  page,
}: {
  submissions: AdminContactSubmission[]
  total: number
  page: number
}) {
  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16">
        <MailOpen className="text-muted-foreground/30 size-10" />
        <p className="text-muted-foreground text-sm">No messages yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {submissions.map((s) => (
        <SubmissionRow key={s.id} submission={s} />
      ))}
      {total > ADMIN_PAGE_SIZE ? (
        <AdminPagination
          basePath="/admin/contact"
          itemLabel="messages"
          page={page}
          paramName="page"
          totalCount={total}
          totalPages={Math.ceil(total / ADMIN_PAGE_SIZE)}
        />
      ) : null}
    </div>
  )
}
