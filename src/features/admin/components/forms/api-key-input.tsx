"use client"

import { CheckCircle2, KeyRound, Loader2, XCircle, Zap } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"

import type { AiProviderId } from "@/features/ai/lib/providers/base"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"

import { inputClassName } from "./form-field"

const VALIDATION_DEBOUNCE_MS = 700
const MIN_KEY_LENGTH = 10

type ValidationStatus = "idle" | "validating" | "valid" | "invalid"

export type ApiKeyValidationResult = {
  valid: boolean
  saved?: boolean
  maskedKey?: string
  error?: string
  latencyMs?: number
}

type ApiKeyInputProps = {
  provider: AiProviderId
  hasStoredKey: boolean
  maskedKey?: string | null
  sourceLabel?: string
  onKeySaved: (provider: AiProviderId, maskedKey: string) => void
  registration: UseFormRegisterReturn
  placeholder?: string
}

async function requestKeyValidation(
  provider: AiProviderId,
  apiKey: string | undefined,
  signal: AbortSignal
): Promise<ApiKeyValidationResult> {
  const response = await fetch("/api/admin/ai-settings/validate-key", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      apiKey?.trim() ? { provider, apiKey: apiKey.trim() } : { provider }
    ),
    signal,
  })

  const payload = (await response.json()) as {
    ok?: boolean
    saved?: boolean
    error?: string
    maskedKey?: string
    latencyMs?: number
  }

  if (!response.ok) {
    return {
      valid: false,
      error: payload.error ?? "Validation request failed",
    }
  }

  return {
    valid: Boolean(payload.ok),
    saved: payload.saved,
    maskedKey: payload.maskedKey,
    error: payload.error,
    latencyMs: payload.latencyMs,
  }
}

export function ApiKeyInput({
  provider,
  hasStoredKey,
  maskedKey,
  sourceLabel,
  onKeySaved,
  registration,
  placeholder = "Paste API key",
}: ApiKeyInputProps) {
  const { onChange, onBlur, ref, name, ...inputProps } = registration
  const [isReconfiguring, setIsReconfiguring] = useState(false)
  const [status, setStatus] = useState<ValidationStatus>("idle")
  const [validationError, setValidationError] = useState<string | null>(null)
  const [testMessage, setTestMessage] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)
  const valueRef = useRef("")
  const lastSavedKeyRef = useRef<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const showConfiguredState = hasStoredKey && !isReconfiguring

  const applyValidationResult = useCallback(
    (result: ApiKeyValidationResult, apiKey: string) => {
      if (result.valid) {
        setStatus("valid")
        setValidationError(null)

        if (
          result.saved &&
          result.maskedKey &&
          lastSavedKeyRef.current !== apiKey
        ) {
          lastSavedKeyRef.current = apiKey
          onKeySaved(provider, result.maskedKey)
          setInputValue("")
          valueRef.current = ""
          onChange({
            target: { value: "", name },
          } as React.ChangeEvent<HTMLInputElement>)
          setIsReconfiguring(false)
          setTestMessage(
            typeof result.latencyMs === "number"
              ? `Saved and ready to use (${result.latencyMs}ms).`
              : "Saved and ready to use."
          )
        }

        return
      }

      setStatus("invalid")
      setValidationError(result.error ?? "Invalid API key")
    },
    [name, onChange, onKeySaved, provider]
  )

  const runValidation = useCallback(
    async (value: string, { immediate = false } = {}) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }

      abortRef.current?.abort()
      valueRef.current = value

      const trimmed = value.trim()

      if (!trimmed) {
        setStatus("idle")
        setValidationError(null)
        setTestMessage(null)
        return
      }

      if (trimmed.length < MIN_KEY_LENGTH) {
        setStatus("idle")
        setValidationError(null)
        return
      }

      if (lastSavedKeyRef.current === trimmed) {
        setStatus("valid")
        return
      }

      const validate = async () => {
        const requestId = ++requestIdRef.current
        const controller = new AbortController()
        abortRef.current = controller

        setStatus("validating")
        setValidationError(null)
        setTestMessage(null)

        try {
          const result = await requestKeyValidation(
            provider,
            trimmed,
            controller.signal
          )

          if (requestId !== requestIdRef.current) {
            return
          }

          applyValidationResult(result, trimmed)
        } catch (error) {
          if (controller.signal.aborted) {
            return
          }

          if (requestId !== requestIdRef.current) {
            return
          }

          setStatus("invalid")
          const message =
            error instanceof Error ? error.message : "Validation request failed"
          setValidationError(message)
        }
      }

      if (immediate) {
        await validate()
        return
      }

      debounceRef.current = setTimeout(() => {
        void validate()
      }, VALIDATION_DEBOUNCE_MS)
    },
    [applyValidationResult, provider]
  )

  const handleTest = useCallback(async () => {
    const trimmed = inputValue.trim()
    const canTestTyped = trimmed.length >= MIN_KEY_LENGTH
    const canTestStored = !canTestTyped && hasStoredKey

    if (!canTestTyped && !canTestStored) {
      setTestMessage("Enter a key before testing.")
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    const requestId = ++requestIdRef.current

    setIsTesting(true)
    setTestMessage(null)
    setValidationError(null)

    if (canTestTyped) {
      setStatus("validating")
    }

    try {
      const result = await requestKeyValidation(
        provider,
        canTestTyped ? trimmed : undefined,
        controller.signal
      )

      if (requestId !== requestIdRef.current) {
        return
      }

      if (canTestTyped) {
        applyValidationResult(result, trimmed)
        if (!result.valid) {
          setTestMessage(result.error ?? "Key test failed.")
        }
        return
      }

      if (result.valid) {
        const latency =
          typeof result.latencyMs === "number" ? ` (${result.latencyMs}ms)` : ""
        setTestMessage(`Key works${latency}.`)
        return
      }

      setTestMessage(result.error ?? "Key test failed.")
    } catch (error) {
      if (controller.signal.aborted) {
        return
      }

      if (requestId !== requestIdRef.current) {
        return
      }

      const message =
        error instanceof Error ? error.message : "Validation request failed"
      setStatus("invalid")
      setTestMessage(message)
      if (canTestTyped) {
        setValidationError(message)
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsTesting(false)
      }
    }
  }, [applyValidationResult, hasStoredKey, inputValue, provider])

  const handleCancelReconfigure = useCallback(() => {
    abortRef.current?.abort()
    setIsReconfiguring(false)
    setInputValue("")
    valueRef.current = ""
    onChange({
      target: { value: "", name },
    } as React.ChangeEvent<HTMLInputElement>)
    setStatus("idle")
    setValidationError(null)
    setTestMessage(null)
  }, [name, onChange])

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (!hasStoredKey) {
      setIsReconfiguring(false)
    }
  }, [hasStoredKey])

  useEffect(() => {
    if (isReconfiguring) {
      inputRef.current?.focus()
    }
  }, [isReconfiguring])

  const trimmedValue = inputValue.trim()
  const canTest =
    trimmedValue.length >= MIN_KEY_LENGTH ||
    (trimmedValue.length === 0 && hasStoredKey)
  const showSpinner = status === "validating" || isTesting

  if (showConfiguredState) {
    return (
      <div className="space-y-1.5">
        <div
          className={cn(
            inputClassName,
            "flex min-h-11 items-center gap-3 border-emerald-500/40 bg-emerald-500/5 py-2.5"
          )}
        >
          <CheckCircle2
            aria-hidden
            className="size-4 shrink-0 text-emerald-500"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Already configured</p>
            {maskedKey ? (
              <p className="text-muted-foreground font-mono text-xs">
                {maskedKey}
              </p>
            ) : null}
            {sourceLabel ? (
              <p className="text-muted-foreground text-xs">{sourceLabel}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              aria-label="Test API key"
              className="size-9"
              disabled={isTesting}
              onClick={() => void handleTest()}
              size="icon"
              title="Test API key"
              type="button"
              variant="outline"
            >
              {isTesting ? (
                <Loader2 aria-hidden className="size-4 animate-spin" />
              ) : (
                <Zap aria-hidden className="size-4" />
              )}
            </Button>
            <Button
              aria-label="Reconfigure API key"
              className="size-9"
              onClick={() => {
                setTestMessage(null)
                setIsReconfiguring(true)
              }}
              size="icon"
              title="Reconfigure API key"
              type="button"
              variant="outline"
            >
              <KeyRound aria-hidden className="size-4" />
            </Button>
          </div>
        </div>
        {testMessage ? (
          <p
            className={cn(
              "px-4 text-xs",
              testMessage.includes("works") || testMessage.includes("Saved")
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-destructive"
            )}
            role="status"
          >
            {testMessage}
          </p>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {hasStoredKey && isReconfiguring ? (
        <div className="flex items-center justify-between gap-2 px-1">
          <p className="text-muted-foreground text-xs">
            Paste a new key to replace the saved one.
          </p>
          <button
            className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
            onClick={handleCancelReconfigure}
            type="button"
          >
            Cancel
          </button>
        </div>
      ) : null}
      <div className="flex items-start gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            {...inputProps}
            autoComplete="off"
            className={cn(
              inputClassName,
              "pr-11",
              status === "valid" &&
                "border-emerald-500/50 focus-visible:ring-emerald-500/30",
              status === "invalid" &&
                "border-destructive/50 focus-visible:ring-destructive/30"
            )}
            id={name}
            name={name}
            onBlur={(event) => {
              onBlur(event)
              valueRef.current = event.target.value
              setInputValue(event.target.value)
              void runValidation(event.target.value, { immediate: true })
            }}
            onChange={(event) => {
              onChange(event)
              valueRef.current = event.target.value
              setInputValue(event.target.value)
              if (event.target.value.trim() !== lastSavedKeyRef.current) {
                setTestMessage(null)
              }
              void runValidation(event.target.value)
            }}
            placeholder={placeholder}
            ref={(node) => {
              ref(node)
              inputRef.current = node
            }}
            spellCheck={false}
            type="password"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center"
          >
            {showSpinner ? (
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            ) : null}
            {!showSpinner && status === "valid" ? (
              <CheckCircle2 className="size-4 text-emerald-500" />
            ) : null}
            {!showSpinner && status === "invalid" ? (
              <XCircle className="text-destructive size-4" />
            ) : null}
          </div>
        </div>
        <Button
          aria-label="Test API key"
          className="size-11 shrink-0"
          disabled={!canTest || isTesting || status === "validating"}
          onClick={() => void handleTest()}
          size="icon"
          title="Test API key"
          type="button"
          variant="outline"
        >
          <Zap aria-hidden className="size-4" />
        </Button>
      </div>
      {validationError ? (
        <p className="text-destructive px-4 text-xs" role="alert">
          {validationError}
        </p>
      ) : null}
      {testMessage ? (
        <p
          className={cn(
            "px-4 text-xs",
            testMessage.includes("works") || testMessage.includes("Saved")
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-destructive"
          )}
          role="status"
        >
          {testMessage}
        </p>
      ) : null}
    </div>
  )
}
