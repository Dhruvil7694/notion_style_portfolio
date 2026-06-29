import { notFound } from "next/navigation"

import { SentryExamplePageClient } from "./sentry-example-page-client"

export default function SentryExamplePage() {
  if (process.env.NODE_ENV === "production") {
    notFound()
  }

  return <SentryExamplePageClient />
}
