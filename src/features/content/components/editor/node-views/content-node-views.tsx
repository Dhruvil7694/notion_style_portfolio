"use client"

import type { NodeViewProps } from "@tiptap/react"
import { NodeViewWrapper } from "@tiptap/react"

import {
  TextArea,
  TextInput,
} from "@/features/admin/components/forms/form-field"
import { ArchitectureDiagramBlock } from "@/features/content/components/blocks/architecture-diagram-block"
import { CalloutBlock } from "@/features/content/components/blocks/callout-block"
import { GlossaryTermBlock } from "@/features/content/components/blocks/glossary-term-block"
import { MentionBlock } from "@/features/content/components/blocks/mention-block"
import { ProjectReferenceBlock } from "@/features/content/components/blocks/project-reference-block"
import { ARCHITECTURE_PRESETS } from "@/features/content/lib/components/architecture-presets"
import type { InlineSpan } from "@/features/content/lib/inline"
import type { ContentBlock } from "@/features/content/lib/schema"
import { cn } from "@/shared/lib/utils"

function NodeShell({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <NodeViewWrapper
      className={cn(
        "border-border bg-muted/20 my-3 rounded-lg border p-3",
        className
      )}
    >
      <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
        {label}
      </p>
      {children}
    </NodeViewWrapper>
  )
}

function CalloutNodeView({ node, updateAttributes }: NodeViewProps) {
  const content = JSON.parse(
    String(node.attrs.contentJson ?? "[]")
  ) as InlineSpan[]
  const variant = node.attrs.variant as
    | "info"
    | "success"
    | "warning"
    | "danger"

  return (
    <NodeShell label="Callout">
      <div className="mb-3 grid gap-2 sm:grid-cols-2">
        <select
          className="border-input bg-background rounded-lg border px-3 py-2 text-sm"
          onChange={(event) =>
            updateAttributes({ variant: event.target.value })
          }
          value={variant}
        >
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="danger">Danger</option>
        </select>
      </div>
      <TextArea
        onChange={(event) =>
          updateAttributes({
            contentJson: JSON.stringify([{ text: event.target.value }]),
          })
        }
        value={content[0]?.text ?? ""}
      />
      <div className="mt-3">
        <CalloutBlock content={content} variant={variant} />
      </div>
    </NodeShell>
  )
}

function GlossaryTermNodeView({ node, updateAttributes }: NodeViewProps) {
  return (
    <NodeShell label="Glossary Term">
      <div className="grid gap-2 sm:grid-cols-2">
        <TextInput
          onChange={(event) => updateAttributes({ term: event.target.value })}
          placeholder="Term"
          value={String(node.attrs.term ?? "")}
        />
        <TextInput
          onChange={(event) => updateAttributes({ title: event.target.value })}
          placeholder="Title"
          value={String(node.attrs.title ?? "")}
        />
      </div>
      <TextArea
        className="mt-2"
        onChange={(event) =>
          updateAttributes({ description: event.target.value })
        }
        placeholder="Description"
        value={String(node.attrs.description ?? "")}
      />
      <div className="mt-3">
        <GlossaryTermBlock
          description={String(node.attrs.description ?? "")}
          term={String(node.attrs.term ?? "")}
          title={String(node.attrs.title ?? "")}
        />
      </div>
    </NodeShell>
  )
}

function ProjectReferenceNodeView({ node, updateAttributes }: NodeViewProps) {
  return (
    <NodeShell label="Project Reference">
      <TextInput
        onChange={(event) =>
          updateAttributes({ projectId: event.target.value })
        }
        placeholder="Project UUID"
        value={String(node.attrs.projectId ?? "")}
      />
      {node.attrs.projectId ? (
        <div className="mt-3">
          <ProjectReferenceBlock projectId={String(node.attrs.projectId)} />
        </div>
      ) : null}
    </NodeShell>
  )
}

function MentionNodeView({ node, updateAttributes }: NodeViewProps) {
  return (
    <NodeShell label="Mention">
      <div className="grid gap-2">
        <TextInput
          onChange={(event) => updateAttributes({ label: event.target.value })}
          placeholder="Label"
          value={String(node.attrs.label ?? "")}
        />
        <TextInput
          onChange={(event) => updateAttributes({ href: event.target.value })}
          placeholder="URL (optional)"
          value={String(node.attrs.href ?? "")}
        />
        <TextArea
          onChange={(event) =>
            updateAttributes({ description: event.target.value })
          }
          placeholder="Description (optional)"
          value={String(node.attrs.description ?? "")}
        />
      </div>
      <div className="mt-3">
        <MentionBlock
          description={String(node.attrs.description ?? "") || undefined}
          href={String(node.attrs.href ?? "") || undefined}
          label={String(node.attrs.label ?? "")}
        />
      </div>
    </NodeShell>
  )
}

function ArchitectureDiagramNodeView({
  node,
  updateAttributes,
}: NodeViewProps) {
  const nodes = JSON.parse(String(node.attrs.nodesJson ?? "[]"))
  const edges = JSON.parse(String(node.attrs.edgesJson ?? "[]"))

  return (
    <NodeShell label="Architecture Diagram">
      <div className="mb-3 flex flex-wrap gap-2">
        {(
          Object.keys(ARCHITECTURE_PRESETS) as Array<
            keyof typeof ARCHITECTURE_PRESETS
          >
        ).map((key) => (
          <button
            className="border-border hover:bg-muted rounded-md border px-2 py-1 text-xs"
            key={key}
            onClick={() =>
              updateAttributes({
                nodesJson: JSON.stringify(ARCHITECTURE_PRESETS[key].nodes),
                edgesJson: JSON.stringify(ARCHITECTURE_PRESETS[key].edges),
              })
            }
            type="button"
          >
            {ARCHITECTURE_PRESETS[key].label}
          </button>
        ))}
      </div>
      <ArchitectureDiagramBlock edges={edges} nodes={nodes} />
    </NodeShell>
  )
}

function ExpandableSectionNodeView({ node, updateAttributes }: NodeViewProps) {
  const nested = JSON.parse(
    String(node.attrs.contentJson ?? "[]")
  ) as ContentBlock[]
  const nestedText =
    nested[0]?.type === "paragraph"
      ? typeof nested[0].content === "string"
        ? nested[0].content
        : (nested[0].content[0]?.text ?? "")
      : ""

  return (
    <NodeShell label="Expandable Section">
      <TextInput
        onChange={(event) => updateAttributes({ title: event.target.value })}
        placeholder="Section title"
        value={String(node.attrs.title ?? "")}
      />
      <TextArea
        className="mt-2"
        onChange={(event) =>
          updateAttributes({
            contentJson: JSON.stringify([
              { type: "paragraph", content: [{ text: event.target.value }] },
            ]),
          })
        }
        placeholder="Nested content"
        value={nestedText}
      />
    </NodeShell>
  )
}

export const ContentNodeViews = {
  Callout: CalloutNodeView,
  GlossaryTerm: GlossaryTermNodeView,
  ProjectReference: ProjectReferenceNodeView,
  Mention: MentionNodeView,
  ArchitectureDiagram: ArchitectureDiagramNodeView,
  ExpandableSection: ExpandableSectionNodeView,
}
