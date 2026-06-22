/**
 * Storage extension point (Phase 4+).
 *
 * Supabase Storage buckets (planned):
 * - public-assets: cover images, avatars
 * - resume: generated PDF files
 * - uploads: editor media (authenticated write)
 */
export const storageConfig = {
  buckets: {
    publicAssets: "public-assets",
    resume: "resume",
    uploads: "uploads",
  },
  maxUploadSizeBytes: 5 * 1024 * 1024,
  allowedImageMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ] as const,
} as const

export type StorageBucket =
  (typeof storageConfig.buckets)[keyof typeof storageConfig.buckets]

/** Placeholder — implement getPublicAssetUrl in Phase 4. */
export function getPublicAssetUrl(): string {
  return ""
}
