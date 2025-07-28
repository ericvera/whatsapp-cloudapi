import type { CloudAPIMediaUploadResponse } from '@whatsapp-cloudapi/types/cloudapi'
import type { Request, Response } from 'express'
import { nanoid } from 'nanoid'
import type { MockMediaEntry } from '../types/media.js'

export class MediaRoutes {
  private mediaStorage = new Map<string, MockMediaEntry>()

  private generateMediaId(): string {
    return `media_${nanoid(6)}`
  }

  public handleMediaUpload(req: Request, res: Response): void {
    try {
      // In a real implementation, we would parse multipart form data
      // For the emulator, we'll simulate the upload process
      const contentType = req.headers['content-type'] ?? ''

      if (!contentType.includes('multipart/form-data')) {
        console.error(
          `❌ Media upload failed: Invalid Content-Type '${contentType}', expected multipart/form-data`,
        )
        res.status(400).json({
          error: {
            message:
              'Content-Type must be multipart/form-data for media uploads',
            type: 'OAuthException',
            code: 400,
          },
        })
        return
      }

      // Extract some basic info for simulation
      const contentLength = parseInt(req.headers['content-length'] ?? '0', 10)

      // Validate file size (5MB limit for images)
      const maxSize = 5 * 1024 * 1024 // 5MB

      if (contentLength > maxSize) {
        console.error(
          `❌ Media upload failed: File size too large (${contentLength.toString()} bytes, max: ${maxSize.toString()} bytes)`,
        )
        res.status(400).json({
          error: {
            message: `File size too large: ${contentLength.toString()} bytes. Maximum allowed: ${maxSize.toString()} bytes`,
            type: 'OAuthException',
            code: 400,
          },
        })
        return
      }

      // Generate mock media ID
      const mediaId = this.generateMediaId()

      // Store mock media entry
      const mockEntry: MockMediaEntry = {
        id: mediaId,
        filename: 'uploaded-image.jpg',
        mimeType: 'image/jpeg',
        size: contentLength,
        uploadedAt: new Date(),
      }

      this.mediaStorage.set(mediaId, mockEntry)

      console.log(
        `📁 Media uploaded (ID: ${mediaId}) - Size: ${contentLength.toString()} bytes`,
      )

      // Return successful upload response
      const response: CloudAPIMediaUploadResponse = {
        id: mediaId,
      }

      res.status(200).json(response)
    } catch (error) {
      console.error('❌ Media upload error:', error)
      res.status(500).json({
        error: {
          message: 'Internal server error during media upload',
          type: 'OAuthException',
          code: 500,
        },
      })
    }
  }

  public listMedia(): MockMediaEntry[] {
    return Array.from(this.mediaStorage.values())
  }
}
