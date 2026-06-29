import { AdminLoginForm } from "@/features/admin/components/login-form"

export const metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return (
    <main className="admin-shell mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-6 p-8">
      <header className="space-y-2 text-center">
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
          Admin
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground text-sm">
          Email and password authentication for the portfolio administrator.
        </p>
      </header>

      <AdminLoginForm />
    </main>
  )
}
