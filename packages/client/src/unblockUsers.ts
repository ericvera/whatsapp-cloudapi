import {
  CloudAPIBlockUsersRequest,
  CloudAPIUnblockUsersResponse,
} from '@whatsapp-cloudapi/types/cloudapi'
import { apiRequest } from './internal/apiRequest.js'

interface UnblockUsersParams {
  /** The access token for the WhatsApp Cloud API */
  accessToken: string
  /** The business phone number ID whose blocklist is updated */
  from: string
  /** The WhatsApp user phone numbers to unblock */
  users: string[]
  /**
   * Optional base URL for the API (defaults to Facebook Graph API, use
   * http://localhost:4004 for emulator)
   */
  baseUrl?: string
}

/**
 * Unblocks a list of WhatsApp users for a business phone number
 * @param params - Unblock users parameters
 * @returns Promise with the unblock response (removed_users / failed_users)
 */
export const unblockUsers = async (
  params: UnblockUsersParams,
): Promise<CloudAPIUnblockUsersResponse> => {
  const { accessToken, from, users, baseUrl } = params

  const body: CloudAPIBlockUsersRequest = {
    messaging_product: 'whatsapp',
    block_users: users.map((user) => ({ user })),
  }

  return apiRequest<CloudAPIUnblockUsersResponse>({
    accessToken,
    method: 'DELETE',
    path: `${from}/block_users`,
    body,
    ...(baseUrl !== undefined && { baseUrl }),
  })
}
