import Image from "next/image"

import { ResetPasswordForm } from "@/features/admin/components/reset-password-form"

export const metadata = {
  title: "Reset Password",
  robots: { index: false, follow: false },
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#111113] p-6 md:p-10">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-2xl border border-white/8 shadow-2xl">
        <div className="relative hidden w-[48%] shrink-0 md:block">
          <Image
            alt=""
            className="h-full w-full object-cover object-center"
            fill
            priority
            sizes="(max-width: 1280px) 48vw, 560px"
            src="/login-bg.jpg"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#18181b]/60" />
        </div>
        <div className="flex flex-1 flex-col justify-center bg-[#18181b] px-10 py-14 sm:px-14">
          <div className="mx-auto w-full max-w-[340px] space-y-10">
            <header className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Portfolio Admin
              </p>
              <h1 className="text-[2rem] font-semibold tracking-tight text-white">
                Set new password
              </h1>
            </header>
            <ResetPasswordForm />
          </div>
        </div>
      </div>
    </main>
  )
}
