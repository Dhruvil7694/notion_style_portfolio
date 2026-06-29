export const JOB_FIT_SCHEDULE_CALL_MIN_SCORE = 75

export function shouldShowJobFitScheduleCta(
  fitScore: number,
  calendlyUrl: string | null | undefined
): boolean {
  return (
    fitScore >= JOB_FIT_SCHEDULE_CALL_MIN_SCORE && Boolean(calendlyUrl?.trim())
  )
}
