"use client"

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"

import { TextInput } from "@/components/admin/forms"
import { JointFlowDiagram } from "@/components/public/joint-flow-diagram-lazy"
import { buttonVariants } from "@/components/ui/button"
import type { ProjectFlowNode } from "@/lib/public/project-case-study"
import { cn } from "@/lib/utils"

type NodeFlowFieldProps = {
  value: ProjectFlowNode[]
  onChange: (value: ProjectFlowNode[]) => void
  placeholder?: string
  error?: string
}

export function NodeFlowField({
  value,
  onChange,
  placeholder = "Node label",
  error,
}: NodeFlowFieldProps) {
  function updateLabel(index: number, label: string) {
    onChange(
      value.map((item, itemIndex) =>
        itemIndex === index ? { ...item, label } : item
      )
    )
  }

  function addNode() {
    onChange([...value, { label: "" }])
  }

  function removeNode(index: number) {
    onChange(value.filter((_, itemIndex) => itemIndex !== index))
  }

  function moveNode(index: number, direction: -1 | 1) {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= value.length) {
      return
    }

    const next = [...value]
    const item = next.splice(index, 1)[0]
    if (!item) {
      return
    }
    next.splice(nextIndex, 0, item)
    onChange(next)
  }

  const previewNodes = value.map((node) => node.label.trim()).filter(Boolean)

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {value.map((node, index) => (
          <div
            className="flex items-center gap-2 rounded-lg border border-border p-3"
            key={`node-${index}`}
          >
            <span className="text-muted-foreground w-6 shrink-0 text-center text-xs tabular-nums">
              {index + 1}
            </span>
            <TextInput
              className="min-w-0 flex-1"
              onChange={(event) => updateLabel(index, event.target.value)}
              placeholder={placeholder}
              value={node.label}
            />
            <div className="flex shrink-0 items-center gap-1">
              <button
                aria-label="Move node up"
                className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                disabled={index === 0}
                onClick={() => moveNode(index, -1)}
                type="button"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                aria-label="Move node down"
                className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                disabled={index === value.length - 1}
                onClick={() => moveNode(index, 1)}
                type="button"
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                aria-label="Remove node"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "text-muted-foreground hover:text-destructive"
                )}
                onClick={() => removeNode(index)}
                type="button"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        onClick={addNode}
        type="button"
      >
        <Plus className="size-4" />
        Add node
      </button>

      {previewNodes.length > 0 ? (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
            Preview
          </p>
          <JointFlowDiagram nodes={previewNodes} />
        </div>
      ) : null}

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}
