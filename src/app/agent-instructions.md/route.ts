import { getPublicSettings } from "@/lib/public/queries"
import { buildAgentInstructionsMd } from "@/lib/seo/agent-instructions"
import { resolveSiteUrl } from "@/lib/seo/canonical"

export const revalidate = 3600

export async function GET(): Promise<Response> {
  const settings = await getPublicSettings()
  const siteUrl = resolveSiteUrl(settings.site.site_url)

  if (!siteUrl) {
    return new Response("Site URL not configured.", {
      status: 503,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    })
  }

  const body = buildAgentInstructionsMd(siteUrl, settings)

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
