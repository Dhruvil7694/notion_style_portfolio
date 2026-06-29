"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useForm, type UseFormReturn, useWatch } from "react-hook-form"

import { AdminDataTable } from "@/features/admin/components/admin-panel"
import {
  EntityForm,
  FormField,
  FormSection,
  SelectInput,
  TextArea,
  TextInput,
} from "@/features/admin/components/forms"
import { AI_SETTINGS_FORM_STEPS } from "@/features/admin/components/forms/ai-settings-form-steps"
import { ApiKeyInput } from "@/features/admin/components/forms/api-key-input"
import {
  createWizardSaveAction,
  EntityFormWizardNav,
  useEntityFormWizard,
} from "@/features/admin/components/forms/entity-form-wizard"
import { StatusBadge } from "@/features/admin/components/status-badge"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import { updateAiSettings } from "@/features/admin/lib/actions/ai-settings"
import {
  type AiSettingsFormData,
  aiSettingsFormSchema,
  type AiSettingsFormValues,
  toAiSettingsFormValues,
} from "@/features/admin/lib/schemas/ai-settings"
import type { AiProviderId } from "@/features/ai/lib/providers/base"
import type { AiProviderCatalogEntry } from "@/features/ai/lib/providers/catalog"
import type { AiSettings } from "@/features/ai/lib/settings"
import { SAVE_MESSAGES } from "@/shared/lib/save-notification"
import { cn } from "@/shared/lib/utils"

type AiSettingsFormProps = {
  settings: AiSettings
  providersCatalog: AiProviderCatalogEntry[]
}

const API_KEY_FIELDS = [
  { provider: "openai", field: "api_key_openai", label: "OpenAI API key" },
  {
    provider: "anthropic",
    field: "api_key_anthropic",
    label: "Anthropic API key",
  },
  {
    provider: "gemini",
    field: "api_key_gemini",
    label: "Google Gemini API key",
  },
  { provider: "groq", field: "api_key_groq", label: "Groq API key" },
  {
    provider: "openrouter",
    field: "api_key_openrouter",
    label: "OpenRouter API key",
  },
  { provider: "nvidia", field: "api_key_nvidia", label: "NVIDIA API key" },
] as const

type ProviderModelFieldProps = {
  form: UseFormReturn<AiSettingsFormValues, unknown, AiSettingsFormData>
  providerName:
    | "public_provider"
    | "copilot_provider"
    | "fallback_provider"
    | "visibility_provider"
  modelName:
    | "public_model"
    | "copilot_model"
    | "fallback_model"
    | "visibility_model"
  providerLabel: string
  modelLabel: string
  providersCatalog: AiProviderCatalogEntry[]
  modelError?: string
}

function ProviderModelField({
  form,
  providerName,
  modelName,
  providerLabel,
  modelLabel,
  providersCatalog,
  modelError,
}: ProviderModelFieldProps) {
  const { register, control, setValue, getValues } = form
  const providerId = useWatch({ control, name: providerName })
  const providerEntry = providersCatalog.find(
    (entry) => entry.id === providerId
  )
  const models = useMemo(() => providerEntry?.models ?? [], [providerEntry])

  useEffect(() => {
    const currentModel = getValues(modelName)
    if (models.length === 0) {
      return
    }

    if (!models.some((model) => model.id === currentModel)) {
      const firstModel = models[0]
      if (firstModel) {
        setValue(modelName, firstModel.id, { shouldDirty: true })
      }
    }
  }, [providerId, models, modelName, getValues, setValue])

  return (
    <>
      <FormField label={providerLabel} name={providerName}>
        <SelectInput {...register(providerName)}>
          {providersCatalog.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.label}
              {provider.configured ? "" : " (no API key)"}
            </option>
          ))}
        </SelectInput>
      </FormField>
      <FormField error={modelError} label={modelLabel} name={modelName}>
        <SelectInput {...register(modelName)}>
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label} ({model.tier})
            </option>
          ))}
        </SelectInput>
      </FormField>
    </>
  )
}

function sourceLabel(source: AiProviderCatalogEntry["source"]): string {
  if (source === "cms") return "Saved in CMS"
  if (source === "env") return "Environment variable"
  return "Not configured"
}

function mergeProviderCatalog(
  serverCatalog: AiProviderCatalogEntry[],
  localCatalog: AiProviderCatalogEntry[]
): AiProviderCatalogEntry[] {
  return serverCatalog.map((serverEntry) => {
    const localEntry = localCatalog.find((entry) => entry.id === serverEntry.id)

    if (serverEntry.configured) {
      return serverEntry
    }

    if (localEntry?.configured && localEntry.source === "cms") {
      return localEntry
    }

    return serverEntry
  })
}

export function AiSettingsForm({
  settings,
  providersCatalog,
}: AiSettingsFormProps) {
  const router = useRouter()
  const initialCatalogRef = useRef(providersCatalog)
  const [catalog, setCatalog] = useState(providersCatalog)
  const { formError, isPending, setFormError, submit } = useFormSubmission()

  useEffect(() => {
    setCatalog((current) => {
      const next = mergeProviderCatalog(providersCatalog, current)
      initialCatalogRef.current = next
      return next
    })
  }, [providersCatalog])

  const form = useForm<AiSettingsFormValues, unknown, AiSettingsFormData>({
    resolver: zodResolver(aiSettingsFormSchema),
    defaultValues: toAiSettingsFormValues(settings),
  })

  const {
    register,
    handleSubmit,
    setError,
    resetField,
    trigger,
    formState: { errors },
  } = form

  const {
    currentStep,
    maxReachedStep,
    goToStep,
    handleNextStep,
    handlePreviousStep,
    handleInvalidSubmit,
  } = useEntityFormWizard({
    steps: AI_SETTINGS_FORM_STEPS,
    mode: "edit",
    trigger: (fields) => trigger(fields as Parameters<typeof trigger>[0]),
    setFormError,
  })

  const saveAiSettings = useCallback(
    async (values: AiSettingsFormData) => {
      const result = await submit(() => updateAiSettings(values), {
        successMessage: SAVE_MESSAGES.aiSettings,
      })
      if (result && !result.success) {
        applyServerFieldErrors(setError, result.fieldErrors)
        throw new Error("Save failed")
      }

      if (result?.success) {
        for (const { field } of API_KEY_FIELDS) {
          resetField(field, { defaultValue: "" })
        }
        router.refresh()
      }
    },
    [resetField, router, setError, submit]
  )

  const handleKeySaved = useCallback(
    (provider: AiProviderId, maskedKey: string) => {
      const field = API_KEY_FIELDS.find(
        (entry) => entry.provider === provider
      )?.field
      if (field) {
        resetField(field, { defaultValue: "" })
      }

      setCatalog((current) => {
        const next = current.map((entry) =>
          entry.id === provider
            ? {
                ...entry,
                configured: true,
                source: "cms" as const,
                maskedKey,
              }
            : entry
        )
        initialCatalogRef.current = next
        return next
      })

      router.refresh()
    },
    [resetField, router]
  )

  const onSubmit = handleSubmit(saveAiSettings, handleInvalidSubmit)
  const onSave = useMemo(
    () =>
      createWizardSaveAction(handleSubmit, saveAiSettings, handleInvalidSubmit),
    [handleInvalidSubmit, handleSubmit, saveAiSettings]
  )

  return (
    <EntityForm formError={formError} onSubmit={onSubmit}>
      <EntityFormWizardNav
        actions={{
          isSubmitting: isPending,
          onBack: handlePreviousStep,
          onNext: handleNextStep,
          onSave,
          submitLabel: "Save AI settings",
        }}
        currentStep={currentStep}
        maxReachedStep={maxReachedStep}
        onStepChange={goToStep}
        steps={AI_SETTINGS_FORM_STEPS}
      />

      {currentStep === 0 ? (
        <div className="space-y-5">
          <FormSection
            description="Valid keys are tested and saved automatically when pasted."
            title="Provider API keys"
            variant="card"
          >
            <div className="grid gap-x-8 gap-y-10 md:grid-cols-2">
              {API_KEY_FIELDS.map(({ provider, field, label }) => {
                const catalogEntry = catalog.find(
                  (entry) => entry.id === provider
                )

                return (
                  <FormField
                    hint={
                      catalogEntry?.configured
                        ? undefined
                        : `Set ${catalogEntry?.envKey ?? "an API key"} or paste a key below.`
                    }
                    key={field}
                    label={label}
                    name={field}
                  >
                    <ApiKeyInput
                      hasStoredKey={Boolean(catalogEntry?.configured)}
                      maskedKey={catalogEntry?.maskedKey}
                      onKeySaved={handleKeySaved}
                      provider={provider}
                      registration={register(field)}
                      sourceLabel={
                        catalogEntry?.configured
                          ? sourceLabel(catalogEntry.source)
                          : undefined
                      }
                    />
                  </FormField>
                )
              })}
            </div>
          </FormSection>

          <FormSection
            description="Configured = key saved and ready to use. Missing = no key found."
            title="Provider status"
            variant="card"
          >
            <AdminDataTable>
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-muted-foreground text-left text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Provider</th>
                    <th className="px-4 py-2.5 font-medium">Source</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {catalog.map((provider) => (
                    <tr className="border-border border-t" key={provider.id}>
                      <td className="px-4 py-3 font-medium">
                        {provider.label}
                      </td>
                      <td className="text-muted-foreground px-4 py-3 text-xs">
                        {provider.configured ? (
                          <span>
                            {sourceLabel(provider.source)}
                            {provider.maskedKey ? (
                              <span className="text-foreground mt-1 block font-mono">
                                {provider.maskedKey}
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          provider.envKey
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          className={cn(
                            provider.configured
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          )}
                          value={provider.configured ? "configured" : "missing"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminDataTable>
          </FormSection>
        </div>
      ) : null}

      {currentStep === 1 ? (
        <div className="space-y-5">
          <FormSection
            description="Provider and model selection for the public assistant and CMS copilot."
            title="AI providers"
            variant="card"
          >
            <div className="grid gap-x-8 gap-y-10 md:grid-cols-2">
              <ProviderModelField
                form={form}
                modelError={errors.public_model?.message}
                modelLabel="Public model"
                modelName="public_model"
                providerLabel="Public provider"
                providerName="public_provider"
                providersCatalog={catalog}
              />
              <ProviderModelField
                form={form}
                modelError={errors.copilot_model?.message}
                modelLabel="Copilot model"
                modelName="copilot_model"
                providerLabel="Copilot provider"
                providerName="copilot_provider"
                providersCatalog={catalog}
              />
              <ProviderModelField
                form={form}
                modelError={errors.fallback_model?.message}
                modelLabel="Fallback model"
                modelName="fallback_model"
                providerLabel="Fallback provider"
                providerName="fallback_provider"
                providersCatalog={catalog}
              />
              <ProviderModelField
                form={form}
                modelError={errors.visibility_model?.message}
                modelLabel="Visibility model"
                modelName="visibility_model"
                providerLabel="Visibility provider"
                providerName="visibility_provider"
                providersCatalog={catalog}
              />
            </div>
          </FormSection>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="space-y-5">
          <FormSection
            description="Customize the public portfolio assistant empty state and input placeholder."
            title="Public assistant text"
            variant="card"
          >
            <div className="grid gap-y-10">
              <FormField
                error={errors.assistant_welcome_text?.message}
                hint="Shown when the chat panel has no messages yet."
                label="Welcome text"
                name="assistant_welcome_text"
              >
                <TextArea rows={3} {...register("assistant_welcome_text")} />
              </FormField>
              <FormField
                error={errors.assistant_placeholder_text?.message}
                hint="Placeholder for the message input field."
                label="Input placeholder"
                name="assistant_placeholder_text"
              >
                <TextInput {...register("assistant_placeholder_text")} />
              </FormField>
            </div>
          </FormSection>
        </div>
      ) : null}

      {currentStep === 3 ? (
        <div className="space-y-5">
          <FormSection
            description="Temperature, token limits, and streaming behavior."
            title="Generation"
            variant="card"
          >
            <div className="grid gap-x-8 gap-y-10 md:grid-cols-3">
              <FormField
                error={errors.temperature?.message}
                label="Temperature"
                name="temperature"
              >
                <TextInput
                  step="0.1"
                  type="number"
                  {...register("temperature")}
                />
              </FormField>
              <FormField
                error={errors.max_tokens?.message}
                label="Max tokens"
                name="max_tokens"
              >
                <TextInput type="number" {...register("max_tokens")} />
              </FormField>
              <FormField label="Streaming enabled" name="streaming_enabled">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...register("streaming_enabled")} />
                  Enable streaming responses
                </label>
              </FormField>
            </div>
          </FormSection>

          <FormSection
            description="Context budget allocation percentages for retrieval."
            title="Context budget"
            variant="card"
          >
            <div className="grid gap-x-8 gap-y-10 md:grid-cols-5">
              <FormField label="Projects %" name="context_budget_projects">
                <TextInput
                  type="number"
                  {...register("context_budget_projects")}
                />
              </FormField>
              <FormField label="Research %" name="context_budget_research">
                <TextInput
                  type="number"
                  {...register("context_budget_research")}
                />
              </FormField>
              <FormField label="Concepts %" name="context_budget_concepts">
                <TextInput
                  type="number"
                  {...register("context_budget_concepts")}
                />
              </FormField>
              <FormField
                label="Technologies %"
                name="context_budget_technologies"
              >
                <TextInput
                  type="number"
                  {...register("context_budget_technologies")}
                />
              </FormField>
              <FormField label="Expertise %" name="context_budget_expertise">
                <TextInput
                  type="number"
                  {...register("context_budget_expertise")}
                />
              </FormField>
            </div>
          </FormSection>
        </div>
      ) : null}
    </EntityForm>
  )
}
