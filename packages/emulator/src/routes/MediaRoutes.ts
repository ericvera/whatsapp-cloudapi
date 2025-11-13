import type { CloudAPIMediaUploadResponse } from '@whatsapp-cloudapi/types/cloudapi'
import type { Request, Response } from 'express'
import multer from 'multer'
import { nanoid } from 'nanoid'
import type { EmulatorLogger } from '../services/Logger.js'
import type {
  MediaExpireResponse,
  MediaListResponse,
  MockMediaEntry,
} from '../types/media.js'

export class MediaRoutes {
  private mediaStorage = new Map<string, MockMediaEntry>()
  private upload: multer.Multer
  private logger: EmulatorLogger

  constructor(
    logger: EmulatorLogger,
    initialMediaStorage?: Map<string, MockMediaEntry>,
  ) {
    this.logger = logger

    // Initialize with imported media storage if provided
    if (initialMediaStorage) {
      this.mediaStorage = initialMediaStorage
    }

    // Configure multer for memory storage (files validated then discarded)
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        // 5MB limit
        fileSize: 5 * 1024 * 1024,
        // Only allow one file
        files: 1,
      },
      fileFilter: (_req, file, cb) => {
        // Validate MIME type
        const supportedMimeTypes = ['image/jpeg', 'image/png']

        if (supportedMimeTypes.includes(file.mimetype)) {
          cb(null, true)
        } else {
          cb(
            new Error(
              `Unsupported MIME type: ${file.mimetype}. Supported types: ${supportedMimeTypes.join(', ')}`,
            ),
          )
        }
      },
    })
  }

  private generateMediaId(): string {
    return `media_${nanoid(6)}`
  }

  /**
   * Removes expired media from storage and logs cleanup
   */
  private cleanupExpiredMedia(): void {
    const now = new Date()
    const expiredIds: string[] = []

    for (const [id, media] of this.mediaStorage.entries()) {
      if (now > media.expiresAt) {
        this.mediaStorage.delete(id)
        expiredIds.push(id)
      }
    }

    if (expiredIds.length > 0) {
      this.logger.mediaOperation('cleanup', expiredIds.join(', '), {
        count: expiredIds.length,
      })
    }
  }

  /**
   * Checks if media ID exists and is not expired
   */
  public isMediaValid(mediaId: string): boolean {
    // First cleanup any expired media
    this.cleanupExpiredMedia()

    const media = this.mediaStorage.get(mediaId)
    if (!media) {
      return false
    }

    const now = new Date()

    return now <= media.expiresAt
  }

  public handleMediaUpload(req: Request, res: Response): void {
    // Use multer middleware to parse multipart data
    void this.upload.single('file')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            this.logger.validationError({
              field: 'file',
              reason: 'File size exceeds 5MB limit',
            })

            res.status(400).json({
              error: {
                message: 'File size exceeds 5MB limit',
                type: 'ValidationError',
                code: 400,
              },
            })

            return
          }

          if (err.code === 'LIMIT_FILE_COUNT') {
            this.logger.validationError({
              field: 'file',
              reason: 'Multiple files not allowed',
            })

            res.status(400).json({
              error: {
                message: 'Only one file allowed per upload',
                type: 'ValidationError',
                code: 400,
              },
            })

            return
          }
        }

        // Handle MIME type validation errors
        const errorMessage = err instanceof Error ? err.message : String(err)

        this.logger.validationError({
          field: 'file',
          reason: errorMessage,
        })

        res.status(400).json({
          error: {
            message: errorMessage,
            type: 'ValidationError',
            code: 400,
          },
        })

        return
      }

      try {
        // Check if file was uploaded
        if (!req.file) {
          this.logger.validationError({
            field: 'file',
            reason: 'No file provided',
          })

          res.status(400).json({
            error: {
              message: 'File is required for media upload',
              type: 'ValidationError',
              code: 400,
            },
          })

          return
        }

        // Validate messaging_product field
        const body = req.body as { messaging_product?: string }
        if (body.messaging_product !== 'whatsapp') {
          this.logger.validationError({
            field: 'messaging_product',
            value: body.messaging_product,
            reason: 'Must be "whatsapp"',
          })

          res.status(400).json({
            error: {
              message: 'messaging_product must be "whatsapp"',
              type: 'ValidationError',
              code: 400,
            },
          })

          return
        }

        const mediaId = this.generateMediaId()
        const now = new Date()
        // 30 days
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

        // Store mock media entry with actual file information
        const mockEntry: MockMediaEntry = {
          id: mediaId,
          filename: req.file.originalname || 'uploaded-image.jpg',
          mimeType: req.file.mimetype,
          size: req.file.size,
          uploadedAt: now,
          expiresAt: expiresAt,
        }

        this.mediaStorage.set(mediaId, mockEntry)

        // File is now discarded - we only keep metadata
        this.logger.mediaOperation('upload', mediaId, {
          size: req.file.size,
          expiresAt: expiresAt.toISOString(),
        })

        const response: CloudAPIMediaUploadResponse = {
          id: mediaId,
        }

        res.status(200).json(response)
      } catch (error) {
        this.logger.error('Media upload error', {
          details: error instanceof Error ? error.message : String(error),
        })

        res.status(500).json({
          error: {
            message: 'Internal server error during media upload',
            type: 'InternalServerError',
            code: 500,
          },
        })
      }
    })
  }

  public listMedia(_req: Request, res: Response): void {
    try {
      // Cleanup expired media before listing
      this.cleanupExpiredMedia()

      const mediaArray = Array.from(this.mediaStorage.values())
      const response: MediaListResponse = {
        media: mediaArray,
        note: `Emulator media storage - ${mediaArray.length.toString()} items (auto-expires after 30 days)`,
      }

      res.status(200).json(response)
    } catch (error) {
      this.logger.error('List media error', {
        details: error instanceof Error ? error.message : String(error),
      })

      res.status(500).json({
        error: {
          message: 'Internal server error during media listing',
          type: 'InternalServerError',
          code: 500,
        },
      })
    }
  }

  /**
   * Manually expire a specific media ID
   */
  public expireMedia(req: Request, res: Response): void {
    try {
      const { id } = req.params

      if (!id) {
        this.logger.validationError({
          field: 'id',
          reason: 'Missing media ID parameter',
        })

        res.status(400).json({
          error: {
            message: 'Media ID parameter is required',
            type: 'ValidationError',
            code: 400,
          },
        })
        return
      }

      const media = this.mediaStorage.get(id)
      if (!media) {
        this.logger.validationError({
          field: 'id',
          value: id,
          reason: 'Media ID not found',
        })

        res.status(404).json({
          error: {
            message: 'Media not found',
            type: 'NotFoundError',
            code: 404,
          },
        })
        return
      }

      // Set expiration to now (effectively expiring it)
      media.expiresAt = new Date()
      this.mediaStorage.set(id, media)

      this.logger.mediaOperation('expire', id)

      const response: MediaExpireResponse = {
        message: `Media ${id} has been expired`,
        expired_at: media.expiresAt.toISOString(),
      }

      res.status(200).json(response)
    } catch (error) {
      this.logger.error('Expire media error', {
        details: error instanceof Error ? error.message : String(error),
      })

      res.status(500).json({
        error: {
          message: 'Internal server error during media expiration',
          type: 'InternalServerError',
          code: 500,
        },
      })
    }
  }

  /**
   * Manually expire all media
   */
  public expireAllMedia(_req: Request, res: Response): void {
    try {
      const mediaIds = Array.from(this.mediaStorage.keys())
      const now = new Date()

      // Expire all media by setting expiresAt to now
      for (const [id, media] of this.mediaStorage.entries()) {
        media.expiresAt = now
        this.mediaStorage.set(id, media)
      }

      this.logger.mediaOperation('expire', mediaIds.join(', '), {
        count: mediaIds.length,
      })

      const response: MediaExpireResponse = {
        message: `${mediaIds.length.toString()} media items have been expired`,
        expired_media_ids: mediaIds,
        expired_at: now.toISOString(),
      }

      res.status(200).json(response)
    } catch (error) {
      this.logger.error('Expire all media error', {
        details: error instanceof Error ? error.message : String(error),
      })

      res.status(500).json({
        error: {
          message: 'Internal server error during bulk media expiration',
          type: 'InternalServerError',
          code: 500,
        },
      })
    }
  }

  /**
   * Get the current media storage for export purposes
   */
  public getMediaStorage(): Map<string, MockMediaEntry> {
    return this.mediaStorage
  }
}
