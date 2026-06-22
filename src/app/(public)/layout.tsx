import type { Metadata } from "next"

import { PublicLayout } from "@/components/public/public-layout"
import { getPublicSettings } from "@/lib/public/queries"
import { buildMetadataBase, resolveSiteUrl } from "@/lib/seo"

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)

  return siteUrl ? buildMetadataBase(siteUrl) : {}
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>
}
