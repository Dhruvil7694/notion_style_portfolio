import { RichContentRenderer } from "@/features/content/components/rich-content-renderer"
import { deserializeContent } from "@/features/content/lib/serializer"
import { getProjectPreviewsForRawContent } from "@/features/portfolio/lib/queries"

type PublicContentProps = {
  content: unknown
  className?: string
}

export async function PublicContent({
  content,
  className,
}: PublicContentProps) {
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
