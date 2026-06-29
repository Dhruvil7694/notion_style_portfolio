"use client"

import { useReactFlow } from "@xyflow/react"
import { Maximize2, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/shared/ui/button"

type DiagramToolbarProps = {
  className?: string
}

export function DiagramToolbar({ className }: DiagramToolbarProps) {
  const { fitView, zoomIn, zoomOut, setViewport } = useReactFlow()

  return (
    <div className={cn("architecture-graph-toolbar", className)}>
      <button
        aria-label="Fit diagram"
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        onClick={() => fitView({ padding: 0.2, duration: 200 })}
        title="Fit diagram"
        type="button"
      >
        <Maximize2 className="size-4" />
      </button>
      <button
        aria-label="Zoom in"
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        onClick={() => zoomIn({ duration: 150 })}
        title="Zoom in"
        type="button"
      >
        <ZoomIn className="size-4" />
      </button>
      <button
        aria-label="Zoom out"
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        onClick={() => zoomOut({ duration: 150 })}
        title="Zoom out"
        type="button"
      >
        <ZoomOut className="size-4" />
      </button>
      <button
        aria-label="Reset view"
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        onClick={() => setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 200 })}
        title="Reset view"
        type="button"
      >
        <RotateCcw className="size-4" />
      </button>
    </div>
  )
}
