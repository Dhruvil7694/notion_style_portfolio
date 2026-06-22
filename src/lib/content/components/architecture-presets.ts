import type { ArchitectureEdge, ArchitectureNode } from "@/lib/content/schema"

export const ARCHITECTURE_PRESETS = {
  rag: {
    label: "RAG Pipeline",
    nodes: [
      { id: "query", label: "Query" },
      { id: "embed", label: "Embed" },
      { id: "retrieve", label: "Retrieve" },
      { id: "llm", label: "LLM" },
      { id: "response", label: "Response" },
    ] as ArchitectureNode[],
    edges: [
      { from: "query", to: "embed" },
      { from: "embed", to: "retrieve" },
      { from: "retrieve", to: "llm", label: "context" },
      { from: "llm", to: "response" },
    ] as ArchitectureEdge[],
  },
  agentic: {
    label: "Agentic Workflow",
    nodes: [
      { id: "input", label: "Input" },
      { id: "planner", label: "Planner" },
      { id: "tools", label: "Tools" },
      { id: "memory", label: "Memory" },
      { id: "output", label: "Output" },
    ] as ArchitectureNode[],
    edges: [
      { from: "input", to: "planner" },
      { from: "planner", to: "tools" },
      { from: "tools", to: "memory" },
      { from: "memory", to: "output" },
    ] as ArchitectureEdge[],
  },
  etl: {
    label: "ETL Pipeline",
    nodes: [
      { id: "source", label: "Source" },
      { id: "extract", label: "Extract" },
      { id: "transform", label: "Transform" },
      { id: "load", label: "Load" },
      { id: "warehouse", label: "Warehouse" },
    ] as ArchitectureNode[],
    edges: [
      { from: "source", to: "extract" },
      { from: "extract", to: "transform" },
      { from: "transform", to: "load" },
      { from: "load", to: "warehouse" },
    ] as ArchitectureEdge[],
  },
  ml_training: {
    label: "ML Training Pipeline",
    nodes: [
      { id: "data", label: "Data" },
      { id: "features", label: "Features" },
      { id: "train", label: "Train" },
      { id: "eval", label: "Evaluate" },
      { id: "deploy", label: "Deploy" },
    ] as ArchitectureNode[],
    edges: [
      { from: "data", to: "features" },
      { from: "features", to: "train" },
      { from: "train", to: "eval" },
      { from: "eval", to: "deploy", label: "pass" },
    ] as ArchitectureEdge[],
  },
} as const

export type ArchitecturePresetKey = keyof typeof ARCHITECTURE_PRESETS
