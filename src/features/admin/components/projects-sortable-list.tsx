"use client"

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useTransition } from "react"

import { useAdminSaveToast } from "@/features/admin/components/admin-save-toast"
import { ListRowDeleteButton } from "@/features/admin/components/list-row-delete-button"
import { StatusBadge } from "@/features/admin/components/status-badge"
import {
  deleteProject,
  reorderProjects,
} from "@/features/admin/lib/actions/projects"
import { adminResourceRoutes } from "@/shared/config/admin-resource-routes"
import { SAVE_MESSAGES } from "@/shared/lib/save-notification"
import { cn, formatDateTime } from "@/shared/lib/utils"

export type ProjectOrderRow = {
  id: string
  title: string
  status: string
  display_order: number
  updated_at: string
}

type ProjectsSortableListProps = {
  projects: ProjectOrderRow[]
}

const routes = adminResourceRoutes.projects

function SortableProjectRow({
  project,
  disabled,
}: {
  project: ProjectOrderRow
  disabled?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id, disabled })

  return (
    <tr
      className={cn(
        "border-border border-b last:border-b-0",
        isDragging && "bg-muted/60 shadow-md"
      )}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <td className="w-10 px-2 py-3">
        <button
          aria-label={`Drag to reorder ${project.title}`}
          className={cn(
            "text-muted-foreground hover:text-foreground flex size-8 cursor-grab items-center justify-center rounded-md active:cursor-grabbing",
            disabled && "cursor-not-allowed opacity-40"
          )}
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden className="size-4" />
        </button>
      </td>
      <td className="px-4 py-3">
        <Link
          className="font-medium hover:underline"
          href={routes.edit(project.id)}
        >
          {project.title}
        </Link>
      </td>
      <td className="px-4 py-3">
        <StatusBadge value={project.status} />
      </td>
      <td className="text-muted-foreground px-4 py-3">
        {formatDateTime(project.updated_at)}
      </td>
      <td className="w-12 px-2 py-3 text-right">
        <div className="flex justify-end">
          <ListRowDeleteButton
            disabled={disabled}
            entityLabel="project"
            itemLabel={project.title}
            onDelete={deleteProject.bind(null, project.id)}
          />
        </div>
      </td>
    </tr>
  )
}

export function ProjectsSortableList({ projects }: ProjectsSortableListProps) {
  const [items, setItems] = useState(projects)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const saveToast = useAdminSaveToast()

  useEffect(() => {
    setItems(projects)
  }, [projects])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    if (oldIndex < 0 || newIndex < 0) {
      return
    }

    const previousItems = items
    const nextItems = arrayMove(previousItems, oldIndex, newIndex)
    setItems(nextItems)
    setError(null)

    startTransition(async () => {
      const result = await reorderProjects(nextItems.map((item) => item.id))

      if (!result.success) {
        setItems(previousItems)
        setError(result.error)
        return
      }

      saveToast?.showSaveSuccess(SAVE_MESSAGES.projectOrder)
    })
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">No projects found.</p>
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Drag projects to set the order shown on your public site. Featured
        projects still appear first.
      </p>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div
        className={cn(
          "border-border overflow-hidden rounded-xl border shadow-md",
          isPending && "opacity-70"
        )}
      >
        <div className="overflow-x-auto">
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-muted/40 border-border border-b">
                <tr>
                  <th className="w-10 px-2 py-3" scope="col">
                    <span className="sr-only">Reorder</span>
                  </th>
                  <th
                    className="text-muted-foreground px-4 py-3 font-medium"
                    scope="col"
                  >
                    Title
                  </th>
                  <th
                    className="text-muted-foreground px-4 py-3 font-medium"
                    scope="col"
                  >
                    Status
                  </th>
                  <th
                    className="text-muted-foreground px-4 py-3 font-medium"
                    scope="col"
                  >
                    Updated At
                  </th>
                  <th className="w-12 px-2 py-3" scope="col">
                    <span className="sr-only">Delete</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <SortableContext
                  items={items.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {items.map((project) => (
                    <SortableProjectRow
                      disabled={isPending}
                      key={project.id}
                      project={project}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
        </div>
      </div>
    </div>
  )
}
