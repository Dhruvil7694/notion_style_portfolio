import { PageShell } from "@/components/public/content-shell"
import { WritingList } from "@/components/public/writing-list"
import { getPublicSettings, getPublishedContent } from "@/lib/public/queries"
import { buildBlogIndexMetadata } from "@/lib/seo"

export async function generateMetadata() {
  const settings = await getPublicSettings()

  return buildBlogIndexMetadata({ settings })
}

export default async function BlogPage() {
  const { data: posts } = await getPublishedContent({ type: "blog" })

  return (
    <PageShell description="Essays, notes, and technical writing." title="Writing">
      {posts.length > 0 ? (
        <WritingList items={posts} />
      ) : (
        <p className="kb-empty-message">Writing will appear here once published.</p>
      )}
    </PageShell>
  )
}
