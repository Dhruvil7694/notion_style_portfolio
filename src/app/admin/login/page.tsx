import Image from "next/image"

import { AdminLoginForm } from "@/features/admin/components/login-form"

export const metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-screen w-full items-stretch overflow-hidden bg-[#0c1410]">
      <Image
        alt=""
        className="object-cover object-center"
        fill
        priority
        sizes="100vw"
        src="/login-bg.jpg"
      />
      <div className="absolute inset-0 bg-black/20" />

      {/* Top-left brand mark */}
      <div className="absolute left-6 top-6 z-10 sm:left-10 sm:top-10">
        <p className="text-lg font-semibold tracking-tight text-white">
          Dhruvil Patel
        </p>
        <p className="text-xs text-white/60">AI Engineer · Portfolio Admin</p>
      </div>

      {/* Glass panel — floating, right side on desktop, full width on mobile */}
      <div className="relative z-10 my-3 ml-auto mr-3 flex w-full flex-col justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30 px-6 py-12 shadow-2xl backdrop-blur-2xl sm:px-10 md:my-6 md:mr-6 md:w-1/2 md:px-16 lg:w-[42%]">
        <div className="mx-auto w-full max-w-[360px]">
          <AdminLoginForm />
        </div>
      </div>
    </main>
  )
}
