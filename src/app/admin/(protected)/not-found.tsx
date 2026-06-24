import Link from "next/link"

export default function AdminNotFound() {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
      <h1 className="text-foreground text-xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground text-sm">
        This admin page does not exist or you may not have access to it.
      </p>
      <Link
        className="text-primary inline-block text-sm hover:underline"
        href="/admin"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
