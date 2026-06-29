import Link from "next/link"

import { cn } from "@/shared/lib/utils"

type PublicNotFoundPageProps = {
  /** Cover site chrome when rendered inside the public layout. */
  overlay?: boolean
}

export function PublicNotFoundPage({
  overlay = false,
}: PublicNotFoundPageProps) {
  return (
    <div
      className={cn(
        "public-site bg-background text-foreground flex flex-col items-center justify-center px-6",
        overlay ? "fixed inset-0 z-[200]" : "min-h-dvh w-full flex-1"
      )}
    >
      <p className="text-[clamp(4.5rem,18vw,9rem)] font-semibold leading-none tracking-tighter text-foreground">
        404
      </p>
      <p className="text-muted-foreground mt-5 max-w-xs text-center text-sm leading-relaxed">
        This page doesn&apos;t exist or was moved.
      </p>
      <Link
        className="bg-foreground text-background mt-10 inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
        href="/"
      >
        Go home
      </Link>
    </div>
  )
}
