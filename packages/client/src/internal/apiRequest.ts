import {
  WhatsAppCloudAPIBaseUrl,
  WhatsAppCloudAPIVersion,
} from '../constants.js'
import { createHeaders } from './sendRequest.js'

/**
 * Parameters for a JSON Cloud API request
 */
export interface ApiRequestParams {
  /**
   * The access token for authentication
   */
  accessToken: string

  /**
   * HTTP method
   */
  method: 'GET' | 'POST' | 'DELETE'

  /**
   * The path after the API version, with no leading slash
   * The helper prepends `{baseUrl}/{version}/`.
   * @example "<media-id>"
   * @example "<phone-number-id>/block_users"
   */
  path: string

  /**
   * Optional JSON body, serialized for POST/DELETE when present
   */
  body?: unknown

  /**
   * Optional base URL for the API (defaults to the Facebook Graph API)
   */
  baseUrl?: string
}

/**
 * Performs a JSON GET/POST/DELETE request against an arbitrary Graph API path.
 * Centralizes the Bearer auth header and the throw-on-!ok error convention used
 * by `sendRequest`. Use this for non-/messages JSON endpoints (media
 * metadata/delete, block API).
 * @param params - The request parameters
 * @returns Promise with the parsed JSON response
 */
export const apiRequest = async <T>({
  accessToken,
  method,
  path,
  body,
  baseUrl,
}: ApiRequestParams): Promise<T> => {
  const apiUrl = baseUrl ?? WhatsAppCloudAPIBaseUrl
  const init: RequestInit = {
    method,
    headers: createHeaders(accessToken),
  }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
  }
  const response = await fetch(
    `${apiUrl}/${WhatsAppCloudAPIVersion}/${path}`,
    init,
  )

  if (!response.ok) {
    const error = await response.json()

    throw new Error(`WhatsApp API Error: ${JSON.stringify(error)}`)
  }

  return response.json() as Promise<T>
}
