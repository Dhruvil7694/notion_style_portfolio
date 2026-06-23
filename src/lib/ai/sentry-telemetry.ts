export function aiTelemetry(functionId: string) {
  return {
    experimental_telemetry: {
      isEnabled: true,
      functionId,
      recordInputs: true,
      recordOutputs: true,
    },
  } as const
}
