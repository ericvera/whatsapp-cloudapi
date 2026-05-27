import {
  CloudAPIBlockUsersRequest,
  CloudAPIBlockUsersResponse,
} from '@whatsapp-cloudapi/types/cloudapi'
import { apiRequest } from './internal/apiRequest.js'

interface BlockUsersParams {
  /** The access token for the WhatsApp Cloud API */
  accessToken: string
  /** The business phone number ID whose blocklist is updated */
  from: string
  /**
   * The WhatsApp user phone numbers to block
   * Maximum 1,000 users per request.
   */
  users: string[]
  /**
   * Optional base URL for the API (defaults to Facebook Graph API, use
   * http://localhost:4004 for emulator)
   */
  baseUrl?: string
}

/**
 * Blocks a list of WhatsApp users for a business phone number
 * @param params - Block users parameters
 * @returns Promise with the block response (added_users / failed_users)
 */
export const blockUsers = async (
  params: BlockUsersParams,
): Promise<CloudAPIBlockUsersResponse> => {
  const { accessToken, from, users, baseUrl } = params

  const body: CloudAPIBlockUsersRequest = {
    messaging_product: 'whatsapp',
    block_users: users.map((user) => ({ user })),
  }

  return apiRequest<CloudAPIBlockUsersResponse>({
    accessToken,
    method: 'POST',
    path: `${from}/block_users`,
    body,
    ...(baseUrl !== undefined && { baseUrl }),
  })
}
