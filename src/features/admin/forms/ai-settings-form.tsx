"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useState } from "react"
import { useForm, type UseFormReturn, useWatch } from "react-hook-form"

import {
  EntityForm,
  FormField,
  FormSection,
  SaveBar,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/admin/forms"
import { StatusBadge } from "@/components/admin/status-badge"
import {
  applyServerFieldErrors,
  useFormSubmission,
} from "@/features/admin/hooks/use-form-submission"
import { updateAiSettings } from "@/lib/admin/actions/ai-settings"
import {
  type AiSettingsFormData,
  aiSettingsFormSchema,
  type AiSettingsFormValues,
  toAiSettingsFormValues,
} from "@/lib/admin/schemas/ai-settings"
import type { AiProviderCatalogEntry } from "@/lib/ai/providers/catalog"
import type { AiSettings } from "@/lib/ai/settings"
import { cn } from "@/lib/utils"

type AiSettingsFormProps = {
  settings: AiSettings
  providersCatalog: AiProviderCatalogEntry[]
}

const API_KEY_FIELDS = [
  { provider: "openai", field: "api_key_openai", label: "OpenAI API key" },
  { provider: "anthropic", field: "api_key_anthropic", label: "Anthropic API key" },
  { provider: "gemini", field: "api_key_gemini", label: "Google Gemini API key" },
  { provider: "groq", field: "api_key_groq", label: "Groq API key" },
  { provider: "openrouter", field: "api_key_openrouter", label: "OpenRouter API key" },
  { provider: "nvidia", field: "api_key_nvidia", label: "NVIDIA API key" },
] as const

type ProviderModelFieldProps = {
  form: UseFormReturn<AiSettingsFormValues, unknown, AiSettingsFormData>
  providerName: "public_provider" | "copilot_provider" | "fallback_provider"
  modelName: "public_model" | "copilot_model" | "fallback_model"
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
  const providerEntry = providersCatalog.find((entry) => entry.id === providerId)
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

export function AiSettingsForm({ settings, providersCatalog }: AiSettingsFormProps) {
  const { formError, isPending, submit } = useFormSubmission()
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const form = useForm<AiSettingsFormValues, unknown, AiSettingsFormData>({
    resolver: zodResolver(aiSettingsFormSchema),
    defaultValues: toAiSettingsFormValues(settings),
  })

  const {
    register,
    handleSubmit,
    setError,
    resetField,
    formState: { errors },
  } = form

  const onSubmit = handleSubmit(async (values) => {
    setFormSuccess(null)
    const result = await submit(() => updateAiSettings(values))
    if (result && !result.success) {
      applyServerFieldErrors(setError, result.fieldErrors)
      return
    }

    if (result?.success && result.data?.message) {
      setFormSuccess(result.data.message)
    }

    for (const { field } of API_KEY_FIELDS) {
      resetField(field, { defaultValue: "" })
    }
  })

  return (
    <EntityForm formError={formError} formSuccess={formSuccess} onSubmit={onSubmit}>
      <FormSection
        description="Add or replace provider keys here. Keys are encrypted before storage and used automatically for assistant and copilot models. Leave a field blank to keep the existing key."
        title="Provider API Keys"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {API_KEY_FIELDS.map(({ provider, field, label }) => {
            const catalogEntry = providersCatalog.find((entry) => entry.id === provider)

            return (
              <FormField
                hint={
                  catalogEntry?.configured
                    ? `Current: ${catalogEntry.maskedKey} (${sourceLabel(catalogEntry.source)})`
                    : `Set ${catalogEntry?.envKey ?? "an API key"} or enter a key below.`
                }
                key={field}
                label={label}
                name={field}
              >
                <TextInput
                  autoComplete="off"
                  placeholder={
                    catalogEntry?.configured
                      ? "Enter a new key to replace the saved key"
                      : "Paste API key"
                  }
                  spellCheck={false}
                  type="password"
                  {...register(field)}
                />
              </FormField>
            )
          })}
        </div>

        <div className="border-border overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-left text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2.5 font-medium">Provider</th>
                <th className="px-4 py-2.5 font-medium">Source</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {providersCatalog.map((provider) => (
                <tr className="border-border border-t" key={provider.id}>
                  <td className="px-4 py-3 font-medium">{provider.label}</td>
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
        </div>
      </FormSection>

      <FormSection
        description="Provider and model selection for the public assistant and CMS copilot."
        title="AI Providers"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <ProviderModelField
            form={form}
            modelError={errors.public_model?.message}
            modelLabel="Public model"
            modelName="public_model"
            providerLabel="Public provider"
            providerName="public_provider"
            providersCatalog={providersCatalog}
          />
          <ProviderModelField
            form={form}
            modelError={errors.copilot_model?.message}
            modelLabel="Copilot model"
            modelName="copilot_model"
            providerLabel="Copilot provider"
            providerName="copilot_provider"
            providersCatalog={providersCatalog}
          />
          <ProviderModelField
            form={form}
            modelError={errors.fallback_model?.message}
            modelLabel="Fallback model"
            modelName="fallback_model"
            providerLabel="Fallback provider"
            providerName="fallback_provider"
            providersCatalog={providersCatalog}
          />
        </div>
      </FormSection>

      <FormSection
        description="Customize the public portfolio assistant empty state and input placeholder."
        title="Public Assistant Text"
      >
        <div className="grid gap-4">
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

      <FormSection description="Generation parameters." title="Generation">
        <div className="grid gap-4 md:grid-cols-3">
          <FormField error={errors.temperature?.message} label="Temperature" name="temperature">
            <TextInput step="0.1" type="number" {...register("temperature")} />
          </FormField>
          <FormField error={errors.max_tokens?.message} label="Max tokens" name="max_tokens">
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
        title="Context Budget"
      >
        <div className="grid gap-4 md:grid-cols-5">
          <FormField label="Projects %" name="context_budget_projects">
            <TextInput type="number" {...register("context_budget_projects")} />
          </FormField>
          <FormField label="Research %" name="context_budget_research">
            <TextInput type="number" {...register("context_budget_research")} />
          </FormField>
          <FormField label="Concepts %" name="context_budget_concepts">
            <TextInput type="number" {...register("context_budget_concepts")} />
          </FormField>
          <FormField label="Technologies %" name="context_budget_technologies">
            <TextInput type="number" {...register("context_budget_technologies")} />
          </FormField>
          <FormField label="Expertise %" name="context_budget_expertise">
            <TextInput type="number" {...register("context_budget_expertise")} />
          </FormField>
        </div>
      </FormSection>

      <SaveBar isSubmitting={isPending} submitLabel="Save AI settings" />
    </EntityForm>
  )
}
