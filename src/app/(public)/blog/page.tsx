import { PageShell } from "@/features/knowledge-base/components/content-shell"
import {
  getPublicSettings,
  getPublishedContent,
} from "@/features/portfolio/lib/queries"
import { buildBlogIndexMetadata } from "@/features/seo/lib"
import { WritingList } from "@/features/writing/components/writing-list"

export async function generateMetadata() {
  const settings = await getPublicSettings()

  return buildBlogIndexMetadata({ settings })
}

export default async function BlogPage() {
  const { data: posts } = await getPublishedContent({ type: "blog" })

  return (
    <PageShell
      description="Essays, notes, and technical writing."
      title="Writing"
    >
      {posts.length > 0 ? (
        <WritingList items={posts} />
      ) : (
        <p className="kb-empty-message">
          Writing will appear here once published.
        </p>
      )}
    </PageShell>
  )
}
