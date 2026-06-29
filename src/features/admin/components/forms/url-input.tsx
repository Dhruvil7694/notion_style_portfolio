"use client"

import { CheckCircle2, XCircle } from "lucide-react"
import {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

import { getOptionalUrlValidationState } from "@/features/admin/lib/schemas/common"
import { cn } from "@/shared/lib/utils"

import { inputClassName } from "./form-field"

function UrlValidationIcon({
  state,
}: {
  state: ReturnType<typeof getOptionalUrlValidationState>
}) {
  if (state === "empty") {
    return null
  }

  if (state === "valid") {
    return (
      <CheckCircle2
        aria-hidden
        className="size-4 shrink-0 text-emerald-600 dark:text-emerald-500"
      />
    )
  }

  return <XCircle aria-hidden className="text-destructive size-4 shrink-0" />
}

type UrlInputProps = React.InputHTMLAttributes<HTMLInputElement>

export const UrlInput = forwardRef<HTMLInputElement, UrlInputProps>(
  function UrlInput(
    { className, onChange, value: controlledValue, defaultValue, ...props },
    ref
  ) {
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [uncontrolledValue, setUncontrolledValue] = useState(() =>
      controlledValue != null
        ? String(controlledValue)
        : defaultValue != null
          ? String(defaultValue)
          : ""
    )

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node
        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
      },
      [ref]
    )

    useLayoutEffect(() => {
      if (controlledValue !== undefined) {
        return
      }

      const node = inputRef.current
      if (node) {
        setUncontrolledValue(node.value)
      }
    }, [controlledValue])

    useEffect(() => {
      if (controlledValue !== undefined) {
        setUncontrolledValue(String(controlledValue))
      }
    }, [controlledValue])

    const displayValue =
      controlledValue !== undefined
        ? String(controlledValue)
        : uncontrolledValue
    const validationState = getOptionalUrlValidationState(displayValue)

    return (
      <div className="relative w-full">
        <input
          {...props}
          className={cn(inputClassName, "pr-11", className)}
          defaultValue={
            controlledValue === undefined ? defaultValue : undefined
          }
          onChange={(event) => {
            if (controlledValue === undefined) {
              setUncontrolledValue(event.target.value)
            }
            onChange?.(event)
          }}
          ref={setRefs}
          {...(controlledValue !== undefined ? { value: controlledValue } : {})}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <UrlValidationIcon state={validationState} />
        </span>
      </div>
    )
  }
)
