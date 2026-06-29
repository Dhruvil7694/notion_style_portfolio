export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function getAdminEmail(): string | undefined {
  const email = process.env.ADMIN_EMAIL?.trim()
  return email || undefined
}

export function isAdminEmail(userEmail: string | undefined | null): boolean {
  const adminEmail = getAdminEmail()
  if (!adminEmail || !userEmail) {
    return false
  }

  return normalizeEmail(userEmail) === normalizeEmail(adminEmail)
}
