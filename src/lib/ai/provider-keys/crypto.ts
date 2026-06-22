import "server-only"

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const KEY_SALT = "ai-provider-keys-v1"

function getEncryptionKey(): Buffer {
  const secret =
    process.env.AI_KEYS_ENCRYPTION_SECRET?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim()

  if (!secret) {
    throw new Error(
      "Set AI_KEYS_ENCRYPTION_SECRET or SUPABASE_SECRET_KEY to store provider API keys in the CMS."
    )
  }

  return scryptSync(secret, KEY_SALT, 32)
}

export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".")
}

export function decryptSecret(payload: string): string {
  const [ivPart, authTagPart, encryptedPart] = payload.split(".")
  if (!ivPart || !authTagPart || !encryptedPart) {
    throw new Error("Invalid encrypted secret payload.")
  }

  const key = getEncryptionKey()
  const iv = Buffer.from(ivPart, "base64url")
  const authTag = Buffer.from(authTagPart, "base64url")
  const encrypted = Buffer.from(encryptedPart, "base64url")
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8")
}

export function maskSecret(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length <= 8) {
    return "••••••••"
  }

  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`
}
