/**
 * Email extension point (Phase 5+).
 *
 * Intended provider: Resend
 *
 * Use cases:
 * - Contact form notification to site owner
 * - Newsletter broadcast (Phase 8)
 */
export const emailConfig = {
  enabled: false,
  provider: "resend" as const,
  fromAddress: process.env.EMAIL_FROM_ADDRESS ?? null,
  replyToAddress: process.env.EMAIL_REPLY_TO_ADDRESS ?? null,
} as const

export type EmailTemplate = "contact_notification" | "newsletter"

/** Placeholder — implement sendEmail in Phase 5. */
export async function sendEmail(): Promise<void> {
  // No-op until Resend is configured.
}
