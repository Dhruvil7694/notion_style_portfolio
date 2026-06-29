import { getPublicSettings } from "@/features/portfolio/lib/queries"
import { resolveSiteUrl } from "@/features/seo/lib/canonical"
import { buildLlmsTxt } from "@/features/seo/lib/llms"

export const revalidate = 3600

export async function GET(): Promise<Response> {
  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)

  if (!siteUrl) {
    return new Response("Site URL not configured.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }

  const body = buildLlmsTxt(siteUrl, settings)

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
