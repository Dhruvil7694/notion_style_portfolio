import { RichContentRenderer } from "@/components/content/rich-content-renderer"
import { deserializeContent } from "@/lib/content/serializer"
import { getProjectPreviewsForRawContent } from "@/lib/public/queries"

type PublicContentProps = {
  content: unknown
  className?: string
}

export async function PublicContent({ content, className }: PublicContentProps) {
  const document = deserializeContent(content)
  const projectPreviews = await getProjectPreviewsForRawContent(content)

  return (
    <RichContentRenderer
      className={className}
      document={document}
      projectPreviews={projectPreviews}
    />
  )
}
