import Link from "next/link"

export default function PublicNotFound() {
  return (
    <div className="mx-auto max-w-content px-6 py-24 text-center">
      <h1 className="text-foreground text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground mt-3 text-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        className="text-primary mt-8 inline-block text-sm hover:underline"
        href="/"
      >
        Return home
      </Link>
    </div>
  )
}
