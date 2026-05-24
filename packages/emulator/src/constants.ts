import type {
  CloudAPIErrorResponse,
  CloudAPIVersion,
} from '@whatsapp-cloudapi/types/cloudapi'

export const SupportedVersion: CloudAPIVersion = 'v25.0'

/**
 * WhatsApp Flow message version
 * Currently only version 3 is supported by the WhatsApp Cloud API
 */
export const WhatsAppFlowMessageVersion = '3'

export const UnsupportedVersionError: CloudAPIErrorResponse = {
  error: {
    message: `This version is not supported. Supported version: ${SupportedVersion}`,
    type: 'UnsupportedVersion',
    code: 400,
    error_subcode: 1,
    error_data: {
      messaging_product: 'whatsapp',
      details:
        'Please update your API version to continue using the WhatsApp Business API',
    },
  },
}

/**
 * A media category supported by the upload endpoint
 */
export type MediaCategory = 'image' | 'audio' | 'video' | 'document' | 'sticker'

/**
 * Per-category supported MIME types and maximum upload size (in bytes).
 * Mirrors the client table; source: docs/cloud-api-v25-coverage.md.
 */
export const MediaSpecByCategory: Record<
  MediaCategory,
  { mimeTypes: readonly string[]; maxBytes: number }
> = {
  image: {
    mimeTypes: ['image/jpeg', 'image/png'],
    maxBytes: 5 * 1024 * 1024,
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
 * All MIME types accepted by the media upload endpoint, across categories.
 */
export const SupportedMediaMimeTypes: readonly string[] = Object.values(
  MediaSpecByCategory,
).flatMap((spec) => spec.mimeTypes)

/**
 * The largest per-category upload size, used as the global multer limit.
 */
export const MaxMediaFileSize: number = Math.max(
  ...Object.values(MediaSpecByCategory).map((spec) => spec.maxBytes),
)
