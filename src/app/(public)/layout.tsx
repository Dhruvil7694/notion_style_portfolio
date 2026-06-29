import type { Metadata } from "next"

import { getPublicSettings } from "@/features/portfolio/lib/queries"
import { buildMetadataBase, resolveSiteUrl } from "@/features/seo/lib"
import { PublicLayout } from "@/features/site-shell/components/public-layout"

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)

  return siteUrl ? buildMetadataBase(siteUrl) : {}
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>
}
