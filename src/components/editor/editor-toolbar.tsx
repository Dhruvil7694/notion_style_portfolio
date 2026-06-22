"use client"

import type { Editor } from "@tiptap/react"
import {
  AtSign,
  Bold,
  BookOpen,
  Boxes,
  ChevronDown,
  Code,
  GitBranch,
  Heading1,
  Heading2,
  Heading3,
  Info,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Quote,
} from "lucide-react"

import { insertSlashBlock } from "@/components/editor/editor-adapter"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type EditorToolbarProps = {
  editor: Editor | null
  className?: string
}

type ToolbarButtonProps = {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <Button
      aria-label={label}
      aria-pressed={active}
      className={cn(active && "bg-muted")}
      disabled={disabled}
      onClick={onClick}
      size="icon-xs"
      title={label}
      type="button"
      variant="ghost"
    >
      {children}
    </Button>
  )
}

function setLink(editor: Editor) {
  const previousUrl = editor.getAttributes("link").href as string | undefined
  const url = window.prompt("Enter URL", previousUrl ?? "https://")

  if (url === null) {
    return
  }

  if (url === "") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run()
    return
  }

  editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
}

function insertComponent(editor: Editor, command: string) {
  insertSlashBlock(editor, command, {
    projectId:
      command === "project"
        ? window.prompt("Project ID (UUID)") ?? undefined
        : undefined,
  })
}

export function EditorToolbar({ editor, className }: EditorToolbarProps) {
  if (!editor) {
    return null
  }

  return (
    <div
      aria-label="Formatting toolbar"
      className={cn(
        "border-border bg-muted/40 flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 p-1.5",
        className
      )}
      role="toolbar"
    >
      <ToolbarButton
        active={editor.isActive("heading", { level: 1 })}
        label="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        label="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 3 })}
        label="Heading 3"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 />
      </ToolbarButton>

      <span aria-hidden className="bg-border mx-1 h-5 w-px" />

      <ToolbarButton
        active={editor.isActive("bold")}
        label="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        label="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </ToolbarButton>

      <span aria-hidden className="bg-border mx-1 h-5 w-px" />

      <ToolbarButton
        active={editor.isActive("bulletList")}
        label="Bullet list"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        label="Numbered list"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered />
      </ToolbarButton>

      <span aria-hidden className="bg-border mx-1 h-5 w-px" />

      <ToolbarButton
        active={editor.isActive("blockquote")}
        label="Quote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("codeBlock")}
        label="Code block"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("link")}
        label="Link"
        onClick={() => setLink(editor)}
      >
        <LinkIcon />
      </ToolbarButton>
      <ToolbarButton
        label="Divider"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus />
      </ToolbarButton>

      <span aria-hidden className="bg-border mx-1 h-5 w-px" />

      <ToolbarButton
        label="Callout"
        onClick={() => insertComponent(editor, "callout")}
      >
        <Info />
      </ToolbarButton>
      <ToolbarButton
        label="Glossary term"
        onClick={() => insertComponent(editor, "glossary")}
      >
        <BookOpen />
      </ToolbarButton>
      <ToolbarButton
        label="Project reference"
        onClick={() => insertComponent(editor, "project")}
      >
        <GitBranch />
      </ToolbarButton>
      <ToolbarButton
        label="Expandable section"
        onClick={() => insertComponent(editor, "expandable")}
      >
        <ChevronDown />
      </ToolbarButton>
      <ToolbarButton
        label="Architecture diagram"
        onClick={() => insertComponent(editor, "architecture")}
      >
        <Boxes />
      </ToolbarButton>
      <ToolbarButton
        label="Mention"
        onClick={() => insertComponent(editor, "mention")}
      >
        <AtSign />
      </ToolbarButton>
    </div>
  )
}
