import { CloudAPIListBlockedUsersResponse } from '@whatsapp-cloudapi/types/cloudapi'
import { apiRequest } from './internal/apiRequest.js'

interface ListBlockedUsersParams {
  /** The access token for the WhatsApp Cloud API */
  accessToken: string
  /** The business phone number ID whose blocklist is read */
  from: string
  /** Optional maximum number of blocked users to return per request */
  limit?: number
  /** Optional cursor for forward pagination */
  after?: string
  /** Optional cursor for backward pagination */
  before?: string
  /**
   * Optional base URL for the API (defaults to Facebook Graph API, use
   * http://localhost:4004 for emulator)
   */
  baseUrl?: string
}

/**
 * Lists the blocked users for a business phone number (paginated)
 * @param params - List blocked users parameters
 * @returns Promise with the list response ({ data, paging })
 */
export const listBlockedUsers = async (
  params: ListBlockedUsersParams,
): Promise<CloudAPIListBlockedUsersResponse> => {
  const { accessToken, from, limit, after, before, baseUrl } = params

  const query = new URLSearchParams()
  if (limit !== undefined) {
    query.set('limit', limit.toString())
  }
  if (after !== undefined) {
    query.set('after', after)
  }
  if (before !== undefined) {
    query.set('before', before)
  }

  const queryString = query.toString()
  const path = queryString
    ? `${from}/block_users?${queryString}`
    : `${from}/block_users`

  return apiRequest<CloudAPIListBlockedUsersResponse>({
    accessToken,
    method: 'GET',
    path,
    ...(baseUrl !== undefined && { baseUrl }),
  })
}
