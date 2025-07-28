export interface MockMediaEntry {
  id: string
  filename: string
  mimeType: string
  size: number
  uploadedAt: Date
  expiresAt: Date
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
