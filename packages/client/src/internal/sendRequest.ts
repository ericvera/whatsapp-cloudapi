import {
  CloudAPIMarkMessageReadRequest,
  CloudAPIRequest,
  CloudAPIMarkReadResponse,
  CloudAPIResponse,
  CloudAPISendTypingIndicatorRequest,
  CloudAPITypingIndicatorResponse,
} from '@whatsapp-cloudapi/types/cloudapi'
import {
  WhatsAppCloudAPIBaseUrl,
  WhatsAppCloudAPIVersion,
} from '../constants.js'

/**
 * Creates headers for WhatsApp API requests
 */
export const createHeaders = (accessToken: string): Record<string, string> => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
})

/**
 * Union type for all possible request types
 */
type CloudAPIRequestUnion =
  | CloudAPIRequest
  | CloudAPIMarkMessageReadRequest
  | CloudAPISendTypingIndicatorRequest

/**
 * Conditional type that maps request type to response type
 */
type CloudAPIResponseType<T extends CloudAPIRequestUnion> =
  T extends CloudAPIMarkMessageReadRequest
    ? CloudAPIMarkReadResponse
    : T extends CloudAPISendTypingIndicatorRequest
      ? CloudAPITypingIndicatorResponse
      : CloudAPIResponse

/**
 * Sends a request to the WhatsApp Cloud API
 * @param accessToken - The access token for authentication
 * @param from - The sender's phone number ID
 * @param message - The message payload to send
 * @param baseUrl - Optional base URL for the API (defaults to Facebook Graph
 *   API)
 * @returns Promise with the API response (type depends on message type)
 */
export const sendRequest = async <T extends CloudAPIRequestUnion>(
  accessToken: string,
  from: string,
  message: T,
  baseUrl?: string,
): Promise<CloudAPIResponseType<T>> => {
  const apiUrl = baseUrl ?? WhatsAppCloudAPIBaseUrl
  const response = await fetch(
    `${apiUrl}/${WhatsAppCloudAPIVersion}/${from}/messages`,
    {
      method: 'POST',
      headers: createHeaders(accessToken),
      body: JSON.stringify(message),
    },
  )

  if (!response.ok) {
    const error = await response.json()

    throw new Error(`WhatsApp API Error: ${JSON.stringify(error)}`)
  }

  return response.json() as Promise<CloudAPIResponseType<T>>
}
