"use client"

import { ArchitectureDiagramBlock } from "@/features/content/components/blocks/architecture-diagram-block"
import { CalloutBlock } from "@/features/content/components/blocks/callout-block"
import { ExpandableBlock } from "@/features/content/components/blocks/expandable-block"
import { GlossaryTermBlock } from "@/features/content/components/blocks/glossary-term-block"
import { MentionBlock } from "@/features/content/components/blocks/mention-block"
import { ProjectReferenceBlock } from "@/features/content/components/blocks/project-reference-block"
import {
  InlineText,
  richTextHasContent,
} from "@/features/content/components/inline-text"
import type { ContentBlock } from "@/features/content/lib/schema"
import { cn } from "@/shared/lib/utils"

export type ProjectPreview = {
  id: string
  title: string
  summary: string
  tech_stack: string[] | null
  status: string
}

type BlockRendererProps = {
  blocks: ContentBlock[]
  projectPreviews?: Record<string, ProjectPreview>
  className?: string
}

function renderBlock(
  block: ContentBlock,
  index: number,
  projectPreviews?: Record<string, ProjectPreview>
) {
  switch (block.type) {
    case "paragraph":
      return richTextHasContent(block.content) ? (
        <p className="leading-7 text-foreground/90" key={index}>
          <InlineText content={block.content} />
        </p>
      ) : null

    case "heading": {
      const Tag = `h${block.level}` as "h1" | "h2" | "h3"
      const sizeClass =
        block.level === 1
          ? "text-3xl font-semibold tracking-tight"
          : block.level === 2
            ? "text-2xl font-semibold tracking-tight"
            : "text-xl font-semibold tracking-tight"

      return richTextHasContent(block.content) ? (
        <Tag className={cn("text-foreground", sizeClass)} key={index}>
          <InlineText content={block.content} />
        </Tag>
      ) : null
    }

    case "bullet_list":
      return (
        <ul className="list-disc space-y-1 pl-6" key={index}>
          {block.items.filter(Boolean).map((item, itemIndex) => (
            <li className="leading-7" key={itemIndex}>
              {item}
            </li>
          ))}
        </ul>
      )

    case "numbered_list":
      return (
        <ol className="list-decimal space-y-1 pl-6" key={index}>
          {block.items.filter(Boolean).map((item, itemIndex) => (
            <li className="leading-7" key={itemIndex}>
              {item}
            </li>
          ))}
        </ol>
      )

    case "quote":
      return richTextHasContent(block.content) ? (
        <blockquote
          className="border-muted-foreground/30 text-muted-foreground border-l-4 pl-4 italic"
          key={index}
        >
          <InlineText content={block.content} />
        </blockquote>
      ) : null

    case "code":
      return (
        <pre
          className="bg-muted overflow-x-auto rounded-lg p-4 text-sm"
          key={index}
        >
          <code>{block.content || " "}</code>
        </pre>
      )

    case "divider":
      return <hr className="border-border my-6" key={index} />

    case "link":
      return (
        <p key={index}>
          <a
            className="text-primary underline-offset-4 hover:underline"
            href={block.href}
            rel="noopener noreferrer"
            target="_blank"
          >
            {block.label}
          </a>
        </p>
      )

    case "callout":
      return (
        <CalloutBlock
          content={block.content}
          key={index}
          variant={block.variant}
        />
      )

    case "glossary_term":
      return (
        <GlossaryTermBlock
          description={block.description}
          key={index}
          tags={block.tags}
          term={block.term}
          title={block.title}
        />
      )

    case "project_reference":
      return (
        <ProjectReferenceBlock
          key={index}
          preview={projectPreviews?.[block.project_id] ?? null}
          projectId={block.project_id}
        />
      )

    case "mention":
      return (
        <span className="leading-7" key={index}>
          <MentionBlock
            description={block.description}
            href={block.href}
            label={block.label}
          />{" "}
        </span>
      )

    case "architecture_diagram":
      return (
        <ArchitectureDiagramBlock
          edges={block.edges}
          key={index}
          nodes={block.nodes}
        />
      )

    case "expandable":
      return (
        <ExpandableBlock
          content={block.content}
          key={index}
          projectPreviews={projectPreviews}
          title={block.title}
        />
      )

    default:
      return (
        <p
          className="text-muted-foreground text-sm italic"
          key={index}
          role="note"
        >
          Unsupported content block.
        </p>
      )
  }
}

export function BlockRenderer({
  blocks,
  projectPreviews,
  className,
}: BlockRendererProps) {
  if (blocks.length === 0) {
    return (
      <p className={cn("text-muted-foreground text-sm italic", className)}>
        No content blocks yet.
      </p>
    )
  }

  return (
    <article className={cn("space-y-4", className)}>
      {blocks.map((block, index) => renderBlock(block, index, projectPreviews))}
    </article>
  )
}
