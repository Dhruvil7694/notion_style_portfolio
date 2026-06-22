"use client"

import { ArchitectureGraphEditor } from "@/features/admin/forms/architecture-graph-editor"
import type {
  ArchitectureGraph,
  ArchitectureNodeType,
} from "@/lib/diagrams/architecture-graph.schema"

type AIDesignGraphEditorProps = {
  value: ArchitectureGraph
  onChange: (value: ArchitectureGraph) => void
  error?: string
}

export function AIDesignGraphEditor({ value, onChange, error }: AIDesignGraphEditorProps) {
  const defaultNodeType: ArchitectureNodeType = "agent"

  return (
    <ArchitectureGraphEditor
      defaultLabel="Research Agent"
      defaultNodeType={defaultNodeType}
      error={error}
      onChange={onChange}
      value={value}
    />
  )
}
