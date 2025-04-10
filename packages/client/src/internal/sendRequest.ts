import {
  CloudAPIRequest,
  CloudAPIResponse,
} from '@whatsapp-cloudapi/types/cloudapi'

/**
 * Creates headers for WhatsApp API requests
 */
export const createHeaders = (accessToken: string): Record<string, string> => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
})

/**
 * Sends a request to the WhatsApp Cloud API
 * @param accessToken - The access token for authentication
 * @param from - The sender's phone number ID
 * @param message - The message payload to send
 * @returns Promise with the API response
 */
export const sendRequest = async (
  accessToken: string,
  from: string,
  message: CloudAPIRequest,
): Promise<CloudAPIResponse> => {
  const response = await fetch(
    `https://graph.facebook.com/v22.0/${from}/messages`,
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

  return response.json() as Promise<CloudAPIResponse>
}
