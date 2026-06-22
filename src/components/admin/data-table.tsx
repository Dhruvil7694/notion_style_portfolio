import { EmptyState } from "@/components/admin/empty-state"
import { cn } from "@/lib/utils"

export type DataTableColumn<T> = {
  key: string
  header: string
  className?: string
  cell: (row: T) => React.ReactNode
}

type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  rows: T[]
  emptyTitle: string
  emptyDescription: string
  getRowKey: (row: T) => string
  className?: string
}

export function DataTable<T>({
  columns,
  rows,
  emptyTitle,
  emptyDescription,
  getRowKey,
  className,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className={className}>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "border-border overflow-hidden rounded-lg border",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-muted/40 border-border border-b">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "text-muted-foreground px-4 py-3 font-medium",
                    column.className
                  )}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className="border-border hover:bg-muted/20 border-b last:border-b-0"
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn("px-4 py-3", column.className)}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
