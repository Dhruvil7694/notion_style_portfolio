"use client"

import {
  FormField,
  SelectInput,
} from "@/features/admin/components/forms/form-field"

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
] as const

type StatusSelectorProps = {
  value: "draft" | "published"
  onChange: (value: "draft" | "published") => void
  error?: string
}

export function StatusSelector({
  value,
  onChange,
  error,
}: StatusSelectorProps) {
  return (
    <FormField error={error} label="Status" name="status" required>
      <SelectInput
        id="status"
        onChange={(event) =>
          onChange(event.target.value as "draft" | "published")
        }
        value={value}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectInput>
    </FormField>
  )
}
