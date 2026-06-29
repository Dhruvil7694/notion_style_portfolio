"use client"

import { ArrowLeft, ArrowRight, Check, Trash2 } from "lucide-react"
import { useCallback, useState } from "react"
import type { FieldErrors, FieldValues, SubmitHandler } from "react-hook-form"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { InlineAction } from "@/shared/ui/inline-action"

export type EntityFormStep<TField extends string = string> = {
  id: string
  title: string
  description: string
  fields: readonly TField[]
}

export type EntityFormWizardNavActions = {
  onBack: () => void
  onNext: () => void
  onSave: () => Promise<void>
  isSubmitting?: boolean
  isDeleting?: boolean
  submitLabel?: string
}

type EntityFormWizardNavProps<TField extends string = string> = {
  steps: readonly EntityFormStep<TField>[]
  currentStep: number
  maxReachedStep: number
  onStepChange: (step: number) => void
  actions?: EntityFormWizardNavActions
  className?: string
}

export function EntityFormWizardNav<TField extends string = string>({
  steps,
  currentStep,
  maxReachedStep,
  onStepChange,
  actions,
  className,
}: EntityFormWizardNavProps<TField>) {
  const step = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1
  const isBusy = actions?.isSubmitting || actions?.isDeleting

  return (
    <div
      className={cn(
        "border-border/60 bg-card/40 mb-8 space-y-5 rounded-xl border p-6 shadow-md",
        className
      )}
    >
      <nav aria-label="Form progress">
        <ol className="flex flex-wrap gap-2">
          {steps.map((item, index) => {
            const isActive = index === currentStep
            const isComplete = index < currentStep
            const isClickable = index <= maxReachedStep

            return (
              <li key={item.id}>
                <button
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                    isActive &&
                      "border-foreground bg-muted text-foreground font-medium",
                    !isActive &&
                      isComplete &&
                      "border-border text-muted-foreground hover:bg-muted/50",
                    !isActive &&
                      !isComplete &&
                      "border-border text-muted-foreground/50",
                    isClickable
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-60"
                  )}
                  disabled={!isClickable}
                  onClick={() => onStepChange(index)}
                  type="button"
                >
                  <span
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-full text-xs",
                      isActive && "bg-foreground text-background",
                      isComplete && !isActive && "bg-muted-foreground/20",
                      !isActive && !isComplete && "bg-muted"
                    )}
                  >
                    {isComplete && !isActive ? (
                      <Check aria-hidden className="size-3" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className="hidden sm:inline">{item.title}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      {step ? (
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Step {currentStep + 1} of {steps.length}
            </p>
            <h2 className="text-lg font-semibold tracking-tight">
              {step.title}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {step.description}
            </p>
          </div>

          {actions ? (
            <div className="flex h-8 shrink-0 items-center gap-1.5">
              <Button
                aria-label="Back"
                className="size-8"
                disabled={isFirstStep || isBusy}
                onClick={actions.onBack}
                size="icon"
                type="button"
                variant="outline"
              >
                <ArrowLeft aria-hidden className="size-3.5" />
              </Button>

              {!isLastStep ? (
                <Button
                  aria-label="Continue"
                  className="size-8"
                  disabled={isBusy}
                  onClick={actions.onNext}
                  size="icon"
                  type="button"
                >
                  <ArrowRight aria-hidden className="size-3.5" />
                </Button>
              ) : null}

              {isLastStep ? (
                <InlineAction
                  actionText="Save"
                  disabled={Boolean(isBusy)}
                  onAction={actions.onSave}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

type EntityFormWizardFooterProps = {
  isSubmitting?: boolean
  isDeleting?: boolean
  onDelete?: () => void
}

export function EntityFormWizardFooter({
  isSubmitting,
  isDeleting,
  onDelete,
}: EntityFormWizardFooterProps) {
  if (!onDelete) {
    return null
  }

  return (
    <div className="mt-10 flex justify-end">
      <Button
        disabled={isSubmitting || isDeleting}
        onClick={onDelete}
        type="button"
        variant="destructive"
      >
        <Trash2 aria-hidden className="size-4" />
        {isDeleting ? "Deleting…" : "Delete"}
      </Button>
    </div>
  )
}

type UseEntityFormWizardOptions<TField extends string> = {
  steps: readonly EntityFormStep<TField>[]
  mode: "create" | "edit"
  trigger: (fields: readonly TField[]) => Promise<boolean>
  setFormError: (message: string | null) => void
}

export function useEntityFormWizard<TField extends string>({
  steps,
  mode,
  trigger,
  setFormError,
}: UseEntityFormWizardOptions<TField>) {
  const [currentStep, setCurrentStep] = useState(0)
  const [maxReachedStep, setMaxReachedStep] = useState(
    mode === "edit" ? steps.length - 1 : 0
  )

  const scrollToFormTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const goToStep = useCallback(
    (step: number) => {
      setCurrentStep(step)
      scrollToFormTop()
    },
    [scrollToFormTop]
  )

  const handleNextStep = useCallback(async () => {
    const stepFields = steps[currentStep]?.fields ?? []
    const valid = await trigger(stepFields)

    if (!valid) {
      setFormError("Fix the highlighted fields before continuing.")
      scrollToFormTop()
      return
    }

    setFormError(null)
    const nextStep = Math.min(currentStep + 1, steps.length - 1)
    setMaxReachedStep((value) => Math.max(value, nextStep))
    goToStep(nextStep)
  }, [currentStep, goToStep, scrollToFormTop, setFormError, steps, trigger])

  const handlePreviousStep = useCallback(() => {
    if (currentStep === 0) {
      return
    }

    setFormError(null)
    goToStep(currentStep - 1)
  }, [currentStep, goToStep, setFormError])

  const handleInvalidSubmit = useCallback(
    (invalidErrors: FieldErrors) => {
      setFormError("Fix the highlighted fields before saving.")
      const errorKeys = Object.keys(invalidErrors)
      const errorStep = steps.findIndex((step) =>
        step.fields.some((field) =>
          errorKeys.some((key) => key === field || key.startsWith(`${field}.`))
        )
      )

      if (errorStep >= 0) {
        setMaxReachedStep((value) => Math.max(value, errorStep))
        goToStep(errorStep)
        return
      }

      scrollToFormTop()
    },
    [goToStep, scrollToFormTop, setFormError, steps]
  )

  return {
    currentStep,
    maxReachedStep,
    goToStep,
    handleNextStep,
    handlePreviousStep,
    handleInvalidSubmit,
  }
}

export function createWizardSaveAction(
  handleSubmit: unknown,
  onValid: unknown,
  onInvalid: unknown
): () => Promise<void> {
  const submitForm = handleSubmit as (
    onValid: SubmitHandler<FieldValues>,
    onInvalid?: (errors: FieldErrors<FieldValues>) => void
  ) => () => Promise<void>
  const saveValues = onValid as SubmitHandler<FieldValues>
  const handleInvalid = onInvalid as (errors: FieldErrors<FieldValues>) => void

  return () =>
    new Promise<void>((resolve, reject) => {
      void submitForm(
        async (data) => {
          try {
            await saveValues(data)
            resolve()
          } catch (error) {
            reject(error)
          }
        },
        (errors) => {
          handleInvalid(errors)
          reject(errors)
        }
      )()
    })
}
