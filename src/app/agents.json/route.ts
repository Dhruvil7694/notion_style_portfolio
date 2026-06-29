import { getPublicSettings } from "@/features/portfolio/lib/queries"
import { buildAgentsJson } from "@/features/seo/lib/agents-json"
import { resolveSiteUrl } from "@/features/seo/lib/canonical"

export const revalidate = 3600

export async function GET(): Promise<Response> {
  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)

  if (!siteUrl) {
    return new Response(JSON.stringify({ error: "Site URL not configured." }), {
      status: 503,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    })
  }

  const body = buildAgentsJson(siteUrl, settings)

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
