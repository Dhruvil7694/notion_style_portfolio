import { mergeAttributes, Node } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"

import { ContentNodeViews } from "@/components/editor/node-views/content-node-views"

function jsonAttr(name: string, fallback = "") {
  return { default: fallback }
}

export const CalloutNode = Node.create({
  name: "callout",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      variant: { default: "info" },
      contentJson: jsonAttr("contentJson", JSON.stringify([{ text: "" }])),
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-type": "callout" }, HTMLAttributes)]
  },
  addNodeView() {
    return ReactNodeViewRenderer(ContentNodeViews.Callout)
  },
})

export const GlossaryTermNode = Node.create({
  name: "glossaryTerm",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      term: { default: "Term" },
      title: { default: "Title" },
      description: { default: "" },
      tagsJson: jsonAttr("tagsJson", "[]"),
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="glossary-term"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-type": "glossary-term" }, HTMLAttributes)]
  },
  addNodeView() {
    return ReactNodeViewRenderer(ContentNodeViews.GlossaryTerm)
  },
})

export const ProjectReferenceNode = Node.create({
  name: "projectReference",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      projectId: { default: "" },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="project-reference"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-type": "project-reference" }, HTMLAttributes)]
  },
  addNodeView() {
    return ReactNodeViewRenderer(ContentNodeViews.ProjectReference)
  },
})

export const MentionNode = Node.create({
  name: "mention",
  group: "block",
  atom: true,
  inline: false,
  selectable: true,
  addAttributes() {
    return {
      label: { default: "Mention" },
      href: { default: "" },
      description: { default: "" },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-type="mention"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes({ "data-type": "mention" }, HTMLAttributes)]
  },
  addNodeView() {
    return ReactNodeViewRenderer(ContentNodeViews.Mention)
  },
})

export const ArchitectureDiagramNode = Node.create({
  name: "architectureDiagram",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      nodesJson: jsonAttr("nodesJson", "[]"),
      edgesJson: jsonAttr("edgesJson", "[]"),
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="architecture-diagram"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-type": "architecture-diagram" }, HTMLAttributes)]
  },
  addNodeView() {
    return ReactNodeViewRenderer(ContentNodeViews.ArchitectureDiagram)
  },
})

export const ExpandableSectionNode = Node.create({
  name: "expandableSection",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      title: { default: "Section" },
      contentJson: jsonAttr("contentJson", "[]"),
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="expandable-section"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-type": "expandable-section" }, HTMLAttributes)]
  },
  addNodeView() {
    return ReactNodeViewRenderer(ContentNodeViews.ExpandableSection)
  },
})

export const contentEditorExtensions = [
  CalloutNode,
  GlossaryTermNode,
  ProjectReferenceNode,
  MentionNode,
  ArchitectureDiagramNode,
  ExpandableSectionNode,
]
