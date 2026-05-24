/**
 * WhatsApp Cloud API constants
 */

/**
 * Default base URL for the WhatsApp Cloud API
 */
export const WhatsAppCloudAPIBaseUrl = 'https://graph.facebook.com'

/**
 * WhatsApp Cloud API version
 */
export const WhatsAppCloudAPIVersion = 'v25.0'

/**
 * WhatsApp Flow message version
 * Currently only version 3 is supported by the WhatsApp Cloud API
 */
export const WhatsAppFlowMessageVersion = '3'

// Text

export const TextBodyMaxLength = 4096

// Interactive (shared across buttons, list, CTA URL, flow)

export const InteractiveBodyMaxLength = 1024
export const InteractiveHeaderTextMaxLength = 60
export const InteractiveFooterMaxLength = 60

// Media

export const MediaCaptionMaxLength = 1024
export const ImageMaxFileSize = 5 * 1024 * 1024
export const ImageSupportedMimeTypes = ['image/jpeg', 'image/png'] as const

/**
 * A media category supported by the upload endpoint
 */
export type MediaCategory = 'image' | 'audio' | 'video' | 'document' | 'sticker'

/**
 * Per-category supported MIME types and maximum upload size (in bytes).
 * Source: docs/cloud-api-v25-coverage.md (Cloud API v25.0 media types).
 */
export const MediaSpecByCategory: Record<
  MediaCategory,
  { mimeTypes: readonly string[]; maxBytes: number }
> = {
  image: {
    mimeTypes: ImageSupportedMimeTypes,
    maxBytes: ImageMaxFileSize,
  },
  audio: {
    mimeTypes: [
      'audio/aac',
      'audio/amr',
      'audio/mpeg',
      'audio/mp4',
      'audio/ogg',
    ],
    maxBytes: 16 * 1024 * 1024,
  },
  video: {
    mimeTypes: ['video/3gpp', 'video/mp4'],
    maxBytes: 16 * 1024 * 1024,
  },
  document: {
    mimeTypes: [
      'text/plain',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    maxBytes: 100 * 1024 * 1024,
  },
  sticker: {
    // WebP only. Static stickers are capped at 100 KB and animated at 500 KB;
    // the larger limit is used here and the API enforces the per-kind split.
    mimeTypes: ['image/webp'],
    maxBytes: 500 * 1024,
  },
}

/**
 * All MIME types supported by the media upload endpoint, across categories.
 */
export const AllSupportedMediaMimeTypes: readonly string[] = Object.values(
  MediaSpecByCategory,
).flatMap((spec) => spec.mimeTypes)

// Buttons (reply buttons)

export const ButtonTextMaxLength = 20
export const ButtonIdMaxLength = 256
export const ButtonsMinCount = 1
export const ButtonsMaxCount = 3

// List

export const ListButtonTextMaxLength = 20
export const ListSectionTitleMaxLength = 24
export const ListSectionsMinCount = 1
export const ListRowIdMaxLength = 200
export const ListRowTitleMaxLength = 24
export const ListRowDescriptionMaxLength = 72
export const ListRowsMaxCount = 10
export const ListRowsPerSectionMinCount = 1

// Callback

export const CallbackDataMaxLength = 512
