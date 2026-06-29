"use client"

import Link from "@tiptap/extension-link"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { useCallback, useEffect, useRef, useState } from "react"

import {
  documentsEqual,
  fromContentDocument,
  insertSlashBlock,
  SLASH_COMMANDS,
  type SlashCommandKey,
  toContentDocument,
  validateEditorContent,
} from "@/features/content/components/editor/editor-adapter"
import { EditorStats } from "@/features/content/components/editor/editor-stats"
import {
  EditorStatus,
  type SaveState,
} from "@/features/content/components/editor/editor-status"
import { EditorToolbar } from "@/features/content/components/editor/editor-toolbar"
import { contentEditorExtensions } from "@/features/content/components/editor/extensions"
import type { ContentDocument } from "@/features/content/lib/schema"
import { cn } from "@/shared/lib/utils"

const AUTOSAVE_DELAY_MS = 2000

type TiptapEditorProps = {
  value: ContentDocument
  onChange: (document: ContentDocument) => void
  onAutosave?: (
    document: ContentDocument
  ) => Promise<{ success: boolean; error?: string }>
  autosaveEnabled?: boolean
  className?: string
}

function applySlashCommand(
  editor: ReturnType<typeof useEditor>,
  command: string,
  context?: { projectId?: string }
) {
  if (!editor) {
    return
  }

  if (
    command === "callout" ||
    command === "glossary" ||
    command === "project" ||
    command === "expandable" ||
    command === "architecture" ||
    command === "mention"
  ) {
    insertSlashBlock(editor, command, context)
    return
  }

  const chain = editor.chain().focus().clearNodes()

  switch (command) {
    case "heading":
      chain.setHeading({ level: 2 }).run()
      break
    case "quote":
      chain.setBlockquote().run()
      break
    case "code":
      chain.setCodeBlock().run()
      break
    case "list":
      chain.toggleBulletList().run()
      break
    case "divider":
      chain.setHorizontalRule().run()
      break
  }
}

export function TiptapEditor({
  value,
  onChange,
  onAutosave,
  autosaveEnabled = false,
  className,
}: TiptapEditorProps) {
  const [saveState, setSaveState] = useState<SaveState>("saved")
  const [saveError, setSaveError] = useState<string | null>(null)
  const [liveDocument, setLiveDocument] = useState<ContentDocument>(value)
  const [slashQuery, setSlashQuery] = useState<string | null>(null)

  const onChangeRef = useRef(onChange)
  const onAutosaveRef = useRef(onAutosave)
  const lastSavedRef = useRef<ContentDocument>(value)
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSavingRef = useRef(false)
  const skipExternalSyncRef = useRef(false)
  const editorRef = useRef<ReturnType<typeof useEditor>>(null)

  onChangeRef.current = onChange
  onAutosaveRef.current = onAutosave

  const handleEditorUpdate = useCallback(
    (editor: NonNullable<ReturnType<typeof useEditor>>) => {
      const validation = validateEditorContent(editor.getJSON())

      if (!validation.success) {
        setSaveError(validation.error)
        setSaveState("unsaved")
        return
      }

      setSaveError(null)
      skipExternalSyncRef.current = true
      setLiveDocument(validation.data)
      onChangeRef.current(validation.data)
      setSaveState("unsaved")

      const { $from } = editor.state.selection
      const parentText = $from.parent.textContent
      const matchedSlash = (
        Object.keys(SLASH_COMMANDS) as SlashCommandKey[]
      ).find((key) => parentText === key || parentText.startsWith(`${key} `))
      setSlashQuery(matchedSlash ?? null)

      if (autosaveEnabled && onAutosaveRef.current) {
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current)
        }

        autosaveTimerRef.current = setTimeout(async () => {
          if (isSavingRef.current) {
            return
          }

          if (documentsEqual(validation.data, lastSavedRef.current)) {
            setSaveState("saved")
            return
          }

          isSavingRef.current = true
          setSaveState("saving")
          setSaveError(null)

          try {
            const result = await onAutosaveRef.current!(validation.data)

            if (result.success) {
              lastSavedRef.current = validation.data
              setSaveState("saved")
              setSaveError(null)
            } else {
              setSaveState("unsaved")
              setSaveError(result.error ?? "Autosave failed")
            }
          } catch {
            setSaveState("unsaved")
            setSaveError("Autosave failed. Your changes are kept locally.")
          } finally {
            isSavingRef.current = false
          }
        }, AUTOSAVE_DELAY_MS)
      }
    },
    [autosaveEnabled]
  )

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: {},
        horizontalRule: {},
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      ...contentEditorExtensions,
    ],
    content: fromContentDocument(value),
    editorProps: {
      attributes: {
        class:
          "tiptap-editor prose prose-sm dark:prose-invert max-w-none min-h-[280px] px-4 py-3 outline-none",
        spellcheck: "true",
      },
      handleKeyDown: (view, event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          const { $from } = view.state.selection
          const text = $from.parent.textContent.trim() as SlashCommandKey
          const command = SLASH_COMMANDS[text]
          const currentEditor = editorRef.current

          if (command && currentEditor) {
            event.preventDefault()
            const from = $from.start()
            const to = $from.end()
            currentEditor.chain().focus().deleteRange({ from, to }).run()
            applySlashCommand(currentEditor, command, {
              projectId:
                command === "project"
                  ? (window.prompt("Project ID (UUID)") ?? undefined)
                  : undefined,
            })
            setSlashQuery(null)
            return true
          }
        }

        return false
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      handleEditorUpdate(currentEditor)
    },
  })

  editorRef.current = editor

  useEffect(() => {
    if (!editor || skipExternalSyncRef.current) {
      skipExternalSyncRef.current = false
      return
    }

    if (!documentsEqual(value, toContentDocument(editor.getJSON()))) {
      editor.commands.setContent(fromContentDocument(value), {
        emitUpdate: false,
      })
      setLiveDocument(value)
      lastSavedRef.current = value
      setSaveState("saved")
    }
  }, [editor, value])

  useEffect(() => {
    lastSavedRef.current = value
    setLiveDocument(value)
  }, [value])

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [])

  const slashOptions = (
    Object.keys(SLASH_COMMANDS) as SlashCommandKey[]
  ).filter((key) => !slashQuery || key.startsWith(slashQuery))

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <EditorStats document={liveDocument} />
        {autosaveEnabled ? (
          <EditorStatus error={saveError} state={saveState} />
        ) : saveState !== "saved" ? (
          <EditorStatus error={saveError} state={saveState} />
        ) : null}
      </div>

      <div className="relative">
        <EditorToolbar editor={editor} />
        <div className="border-border bg-background relative rounded-b-lg border">
          <EditorContent editor={editor} />
          {slashQuery && slashOptions.length > 0 ? (
            <div
              className="border-border bg-popover absolute left-4 z-10 mt-1 w-48 rounded-lg border p-1 shadow-md"
              role="listbox"
            >
              <p className="text-muted-foreground px-2 py-1 text-xs">
                Slash commands — press Enter
              </p>
              {slashOptions.map((option) => (
                <button
                  aria-selected={slashQuery === option}
                  className="hover:bg-muted w-full rounded-md px-2 py-1.5 text-left text-sm"
                  key={option}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    if (editor) {
                      const command = SLASH_COMMANDS[option]
                      applySlashCommand(editor, command, {
                        projectId:
                          command === "project"
                            ? (window.prompt("Project ID (UUID)") ?? undefined)
                            : undefined,
                      })
                      setSlashQuery(null)
                    }
                  }}
                  role="option"
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <p className="text-muted-foreground text-xs">
        Shortcuts: ⌘/Ctrl+B bold · ⌘/Ctrl+I italic · ⌘/Ctrl+Shift+7 numbered
        list · ⌘/Ctrl+Shift+8 bullet list · Slash: /heading /quote /code /list
        /divider /callout /glossary /project /expandable /architecture /mention
      </p>
    </div>
  )
}
