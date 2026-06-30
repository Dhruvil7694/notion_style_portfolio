import { Suspense } from "react"

import { PageHeader } from "@/features/admin/components"
import { ContactInbox } from "@/features/admin/components/contact-inbox"
import { ListToolbar } from "@/features/admin/components/forms"
import { getContactSubmissions } from "@/features/admin/lib/queries"

export const metadata = {
  title: "Contact Inbox",
  robots: { index: false, follow: false },
}

type AdminContactPageProps = {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function AdminContactPage({
  searchParams,
}: AdminContactPageProps) {
  const params = await searchParams
  const page = params.page ? parseInt(params.page, 10) : 1
  const {
    data: submissions,
    count,
    error,
  } = await getContactSubmissions({
    q: params.q,
    page,
  })

  const unreadCount = (submissions ?? []).filter((s) => !s.read_at).length

  return (
    <div className="space-y-6">
      <PageHeader
        description={
          unreadCount > 0
            ? `${unreadCount} unread message${unreadCount !== 1 ? "s" : ""}`
            : "All messages from the contact form."
        }
        title="Contact Inbox"
      />

      <Suspense fallback={null}>
        <ListToolbar placeholder="Search by name, email, or subject…" />
      </Suspense>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          Unable to load submissions: {error.message}
        </p>
      ) : (
        <ContactInbox
          submissions={submissions ?? []}
          total={count ?? 0}
          page={page}
        />
      )}
    </div>
  )
}
