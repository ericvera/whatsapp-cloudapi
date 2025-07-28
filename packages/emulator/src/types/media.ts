export interface MockMediaEntry {
  id: string
  filename: string
  mimeType: string
  size: number
  uploadedAt: Date
}

export interface MediaListResponse {
  media: MockMediaEntry[]
  note: string
}
