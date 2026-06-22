import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { getCurrentUser } from "@/lib/auth"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Unauthorized",
  robots: { index: false, follow: false },
}

export default async function AdminUnauthorizedPage() {
  const user = await getCurrentUser()

  return (
    <main className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center gap-6 p-8 text-center">
      <header className="space-y-2">
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
          Admin
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">403 — Unauthorized</h1>
        <p className="text-muted-foreground text-sm">
          Your account is signed in but is not authorized to access the admin area.
        </p>
        {user?.email ? (
          <p className="text-muted-foreground text-sm">
            Signed in as <span className="font-medium">{user.email}</span>
          </p>
        ) : null}
      </header>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          className={cn(buttonVariants({ variant: "outline" }))}
          href="/admin/logout"
        >
          Sign out
        </Link>
        <Link className={cn(buttonVariants({ variant: "ghost" }))} href="/">
          Back to site
        </Link>
      </div>
    </main>
  )
}
