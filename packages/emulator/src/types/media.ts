export interface MockMediaEntry {
  id: string
  filename: string
  mimeType: string
  size: number
  uploadedAt: Date
  expiresAt: Date
  /**
   * The uploaded file bytes, retained in memory only.
   * Absent for entries loaded from a (metadata-only) manifest.
   */
  data?: Buffer
  /** SHA256 hash of the uploaded bytes (hex) */
  sha256?: string
}

export interface MediaListResponse {
  media: MockMediaEntry[]
  note: string
}

export interface MediaExpireResponse {
  message: string
  expired_at: string
  expired_media_ids?: string[]
}
