"use client"

import "@xyflow/react/dist/style.css"

import {
  addEdge,
  Connection,
  type Edge,
  type Node,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useOnSelectionChange,
  useReactFlow,
} from "@xyflow/react"
import { Plus, Trash2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { CollapsiblePreview } from "@/features/admin/components/collapsible-preview"
import { TextInput } from "@/features/admin/components/forms"
import { LucideIconPicker } from "@/features/admin/components/forms/lucide-icon-picker"
import { ArchitectureDiagramLazy } from "@/features/diagrams/components/architecture-diagram-lazy"
import { architectureNodeTypes } from "@/features/diagrams/components/architecture-node"
import { DiagramToolbar } from "@/features/diagrams/components/diagram-toolbar"
import { architectureEdgeTypes } from "@/features/diagrams/components/labeled-edge"
import type {
  ArchitectureGraph,
  ArchitectureGraphEdge,
  ArchitectureGraphNode,
  ArchitectureNodeType,
} from "@/features/diagrams/lib/architecture-graph.schema"
import {
  createGraphEdgeId,
  createGraphNodeId,
  defaultNodePosition,
} from "@/features/diagrams/lib/architecture-graph.schema"
import {
  ARCHITECTURE_NODE_TYPE_CONFIG,
  ARCHITECTURE_NODE_TYPE_OPTIONS,
  defaultIconForNodeType,
} from "@/features/diagrams/lib/architecture-node-types"
import {
  graphFromReactFlowState,
  toReactFlowEdges,
  toReactFlowNodes,
} from "@/features/diagrams/lib/react-flow-adapters"
import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

type ArchitectureGraphEditorProps = {
  value: ArchitectureGraph
  onChange: (value: ArchitectureGraph) => void
  defaultNodeType?: ArchitectureNodeType
  defaultLabel?: string
  error?: string
}

type SelectionState = {
  nodeId: string | null
  edgeId: string | null
}

function GraphEditorCanvas({
  value,
  onChange,
  defaultNodeType,
  defaultLabel,
}: Omit<ArchitectureGraphEditorProps, "error">) {
  const initialNodes = useMemo(
    () => toReactFlowNodes(value.nodes, { draggable: true, selectable: true }),
    [value.nodes]
  )
  const initialEdges = useMemo(
    () => toReactFlowEdges(value.edges, value.nodes, { labelMode: "all" }),
    [value.edges, value.nodes]
  )
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(initialNodes)
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selection, setSelection] = useState<SelectionState>({
    nodeId: null,
    edgeId: null,
  })
  const { fitView, getNodes } = useReactFlow()

  useEffect(() => {
    setFlowNodes(
      toReactFlowNodes(value.nodes, { draggable: true, selectable: true })
    )
    setFlowEdges(
      toReactFlowEdges(value.edges, value.nodes, { labelMode: "all" })
    )
  }, [setFlowEdges, setFlowNodes, value.edges, value.nodes])

  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      setSelection({
        nodeId: nodes[0]?.id ?? null,
        edgeId: edges[0]?.id ?? null,
      })
    },
  })

  const emitChange = useCallback(
    (
      nextNodes: ArchitectureGraphNode[],
      nextEdges: ArchitectureGraphEdge[]
    ) => {
      onChange({ nodes: nextNodes, edges: nextEdges })
    },
    [onChange]
  )

  const syncFromFlow = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      const graph = graphFromReactFlowState(value.nodes, nodes, edges)
      emitChange(graph.nodes, graph.edges)
    },
    [emitChange, value.nodes]
  )

  function handleConnect(connection: Connection) {
    const nextEdges = addEdge(
      {
        ...connection,
        id: createGraphEdgeId(),
        type: "labeled",
      },
      flowEdges
    )
    setFlowEdges(nextEdges)
    syncFromFlow(flowNodes, nextEdges)
  }

  function handleNodeDragStop() {
    syncFromFlow(getNodes(), flowEdges)
  }

  function addNode() {
    const nodeType = defaultNodeType ?? "service"
    const nextNode: ArchitectureGraphNode = {
      id: createGraphNodeId(),
      type: nodeType,
      label: defaultLabel ?? ARCHITECTURE_NODE_TYPE_CONFIG[nodeType].label,
      description: "",
      icon: defaultIconForNodeType(nodeType),
      position: defaultNodePosition(value.nodes.length),
    }

    const nextNodes = [...value.nodes, nextNode]
    emitChange(nextNodes, value.edges)

    window.setTimeout(() => fitView({ padding: 0.2, duration: 200 }), 0)
  }

  function deleteSelected() {
    if (selection.edgeId) {
      const nextEdges = value.edges.filter(
        (edge) => edge.id !== selection.edgeId
      )
      emitChange(value.nodes, nextEdges)
      setSelection({ nodeId: null, edgeId: null })
      return
    }

    if (selection.nodeId) {
      const nextNodes = value.nodes.filter(
        (node) => node.id !== selection.nodeId
      )
      const nextEdges = value.edges.filter(
        (edge) =>
          edge.source !== selection.nodeId && edge.target !== selection.nodeId
      )
      emitChange(nextNodes, nextEdges)
      setSelection({ nodeId: null, edgeId: null })
    }
  }

  function updateSelectedNode(partial: Partial<ArchitectureGraphNode>) {
    if (!selection.nodeId) {
      return
    }

    const nextNodes = value.nodes.map((node) =>
      node.id === selection.nodeId ? { ...node, ...partial } : node
    )
    emitChange(nextNodes, value.edges)
  }

  function updateSelectedEdge(partial: Partial<ArchitectureGraphEdge>) {
    if (!selection.edgeId) {
      return
    }

    const nextEdges = value.edges.map((edge) =>
      edge.id === selection.edgeId ? { ...edge, ...partial } : edge
    )
    emitChange(value.nodes, nextEdges)
  }

  const selectedNode =
    value.nodes.find((node) => node.id === selection.nodeId) ?? null
  const selectedEdge =
    value.edges.find((edge) => edge.id === selection.edgeId) ?? null

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          onClick={addNode}
          type="button"
        >
          <Plus className="size-4" />
          Add node
        </button>
        <button
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          disabled={!selection.nodeId && !selection.edgeId}
          onClick={deleteSelected}
          type="button"
        >
          <Trash2 className="size-4" />
          Delete selected
        </button>
      </div>

      <div className="grid gap-x-8 gap-y-10 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="architecture-graph-editor-canvas">
          <ReactFlow
            edges={flowEdges}
            edgeTypes={architectureEdgeTypes}
            fitView
            maxZoom={1.5}
            minZoom={0.25}
            nodes={flowNodes}
            nodeTypes={architectureNodeTypes}
            onConnect={handleConnect}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={handleNodeDragStop}
            onNodesChange={onNodesChange}
            proOptions={{ hideAttribution: true }}
          >
            <DiagramToolbar />
          </ReactFlow>
        </div>

        <aside className="border-border space-y-4 rounded-lg border p-4">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Properties
          </p>

          {selectedNode ? (
            <div className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Type</span>
                <select
                  className="border-input bg-background focus-visible:ring-ring w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                  onChange={(event) => {
                    const type = event.target.value as ArchitectureNodeType
                    updateSelectedNode({
                      type,
                      icon: defaultIconForNodeType(type),
                    })
                  }}
                  value={selectedNode.type}
                >
                  {ARCHITECTURE_NODE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Title</span>
                <TextInput
                  onChange={(event) =>
                    updateSelectedNode({ label: event.target.value })
                  }
                  value={selectedNode.label}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Description</span>
                <TextInput
                  onChange={(event) =>
                    updateSelectedNode({ description: event.target.value })
                  }
                  placeholder="Optional description"
                  value={selectedNode.description ?? ""}
                />
              </label>

              <div className="space-y-1.5">
                <span className="text-sm font-medium">Icon</span>
                <LucideIconPicker
                  onChange={(icon) => updateSelectedNode({ icon })}
                  value={
                    selectedNode.icon ||
                    defaultIconForNodeType(selectedNode.type)
                  }
                />
              </div>
            </div>
          ) : selectedEdge ? (
            <div className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Edge label</span>
                <TextInput
                  onChange={(event) =>
                    updateSelectedEdge({ label: event.target.value })
                  }
                  placeholder="Query, Validation, Prompt..."
                  value={selectedEdge.label ?? ""}
                />
              </label>

              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={Boolean(selectedEdge.animated)}
                  onChange={(event) =>
                    updateSelectedEdge({ animated: event.target.checked })
                  }
                  type="checkbox"
                />
                Animated edge
              </label>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Select a node or edge to edit properties. Drag from the bottom
              handle of one node to the top handle of another to connect them.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}

export function ArchitectureGraphEditor({
  value,
  onChange,
  defaultNodeType,
  defaultLabel,
  error,
}: ArchitectureGraphEditorProps) {
  return (
    <div className="space-y-5">
      <ReactFlowProvider>
        <GraphEditorCanvas
          defaultLabel={defaultLabel}
          defaultNodeType={defaultNodeType}
          onChange={onChange}
          value={value}
        />
      </ReactFlowProvider>

      {value.nodes.length > 0 ? (
        <CollapsiblePreview>
          <ArchitectureDiagramLazy edges={value.edges} nodes={value.nodes} />
        </CollapsiblePreview>
      ) : null}

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
    </div>
  )
}
