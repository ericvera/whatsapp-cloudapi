interface DownloadMediaParams {
  /** The access token for the WhatsApp Cloud API */
  accessToken: string
  /**
   * The media download URL obtained from getMediaUrl
   * This is an absolute, short-lived URL (a lookaside CDN host) that requires
   * the access token to download.
   */
  url: string
}

/**
 * Downloads the binary content of a media asset from its download URL
 * The URL must come from getMediaUrl and is fetched with the Bearer token.
 * @param params - Download media parameters
 * @returns Promise with the media binary as a Blob
 */
export const downloadMedia = async (
  params: DownloadMediaParams,
): Promise<Blob> => {
  const { accessToken, url } = params

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`WhatsApp Media Download Error: ${error}`)
  }

  return response.blob()
}
