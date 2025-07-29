import { promises as fs } from 'fs'
import { dirname } from 'path'
import type { MockMediaEntry } from '../types/media.js'

export interface MediaManifest {
  version: string
  exportedAt: string
  media: MockMediaEntry[]
}

const ManifestFilename = 'media-manifest.json'
const ManifestVersion = '1.0'

/**
 * Import media metadata from a directory
 */
export async function importMedia(
  importPath: string,
): Promise<Map<string, MockMediaEntry>> {
  const manifestPath = `${importPath}/${ManifestFilename}`
  const mediaStorage = new Map<string, MockMediaEntry>()

  try {
    // Read and parse manifest
    const manifestContent = await fs.readFile(manifestPath, 'utf8')
    const manifest = JSON.parse(manifestContent) as MediaManifest

    if (manifest.version !== ManifestVersion) {
      console.warn(
        `⚠️  Manifest version ${manifest.version} may be incompatible with current version ${ManifestVersion}`,
      )
    }

    const now = new Date()
    let validCount = 0
    let expiredCount = 0

    // Load non-expired media entries
    for (const mediaEntry of manifest.media) {
      const expiresAt = new Date(mediaEntry.expiresAt)

      if (now <= expiresAt) {
        // Convert string dates back to Date objects
        const entry: MockMediaEntry = {
          ...mediaEntry,
          uploadedAt: new Date(mediaEntry.uploadedAt),
          expiresAt: expiresAt,
        }
        mediaStorage.set(mediaEntry.id, entry)
        validCount++
      } else {
        expiredCount++
      }
    }

    console.log(
      `📁 Imported ${validCount.toString()} valid media entries from ${manifestPath}`,
    )
    if (expiredCount > 0) {
      console.log(
        `🧹 Auto-cleaned ${expiredCount.toString()} expired media entries`,
      )
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(
        `📁 No existing media manifest found at ${manifestPath}, starting fresh`,
      )
    } else if (error instanceof SyntaxError) {
      console.error(
        `❌ Invalid JSON in media manifest at ${manifestPath}, starting fresh`,
      )
    } else {
      console.error(`❌ Error importing media from ${manifestPath}:`, error)
      throw error
    }
  }

  return mediaStorage
}

/**
 * Export media metadata to a directory
 */
export async function exportMedia(
  exportPath: string,
  mediaStorage: Map<string, MockMediaEntry>,
): Promise<void> {
  const manifestPath = `${exportPath}/${ManifestFilename}`

  try {
    // Ensure export directory exists
    await fs.mkdir(dirname(manifestPath), { recursive: true })

    // Auto-cleanup expired entries before export
    const now = new Date()
    const validEntries: MockMediaEntry[] = []
    let expiredCount = 0

    for (const [id, entry] of mediaStorage.entries()) {
      if (now <= entry.expiresAt) {
        validEntries.push(entry)
      } else {
        mediaStorage.delete(id)
        expiredCount++
      }
    }

    if (expiredCount > 0) {
      console.log(
        `🧹 Auto-cleaned ${expiredCount.toString()} expired media entries before export`,
      )
    }

    // Create manifest
    const manifest: MediaManifest = {
      version: ManifestVersion,
      exportedAt: now.toISOString(),
      media: validEntries,
    }

    // Write manifest to file
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')

    console.log(
      `💾 Exported ${validEntries.length.toString()} media entries to ${manifestPath}`,
    )
  } catch (error) {
    console.error(`❌ Error exporting media to ${manifestPath}:`, error)
    throw error
  }
}
