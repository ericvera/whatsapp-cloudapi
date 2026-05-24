// Ref: https://developers.facebook.com/docs/whatsapp/cloud-api/block-users/

/**
 * A single user identifier in a block / unblock request
 */
export interface CloudAPIBlockUserEntry {
  /**
   * WhatsApp user phone number
   * The same value returned by the API as the `input` value when sending a
   * message to a WhatsApp user. A user's phone number and ID may not match.
   * @example "+16505551234"
   */
  user: string
}

/**
 * Request body for blocking or unblocking users
 * Used by both POST (block) and DELETE (unblock)
 * /{phone-number-id}/block_users.
 */
export interface CloudAPIBlockUsersRequest {
  /**
   * Identifier for the messaging service
   * Always set to 'whatsapp'
   */
  messaging_product: 'whatsapp'

  /**
   * The list of users to block or unblock
   * Maximum 1,000 users per request.
   */
  block_users: CloudAPIBlockUserEntry[]
}

/**
 * A user that was successfully added to (blocked) or removed from (unblocked)
 * the blocklist
 */
export interface CloudAPIBlockedUserSuccess {
  /**
   * The phone number provided in the request (echo of `user`)
   */
  input: string

  /**
   * WhatsApp user ID for the user
   * May not match the phone number.
   */
  wa_id: string
}

/**
 * Error describing why a single user could not be blocked / unblocked
 */
export interface CloudAPIBlockUserError {
  /**
   * Error message describing why the operation failed
   * @example "Re-engagement required"
   */
  message: string

  /**
   * Error code
   * @example 131047
   */
  code: number

  /**
   * Additional error details
   */
  error_data?: {
    /**
     * Detailed explanation of the error
     * @example "User has not messaged in the last 24 hours"
     */
    details: string
  }
}

/**
 * A user that could not be blocked / unblocked, with the reason(s)
 */
export interface CloudAPIBlockedUserFailure {
  /**
   * The phone number provided in the request (echo of `user`)
   */
  input: string

  /**
   * WhatsApp user ID for the user
   * May be absent when the number is invalid.
   */
  wa_id?: string

  /**
   * The error(s) explaining why this user failed
   */
  errors: CloudAPIBlockUserError[]
}

/**
 * Top-level error returned alongside a partial block / unblock failure
 * Present when some (but not all) users in the request failed.
 */
export interface CloudAPIBlockUsersError {
  /**
   * Error message
   * @example "(#139100) Failed to block/unblock users"
   */
  message: string

  /**
   * Type of error that occurred
   * @example "OAuthException"
   */
  type: string

  /**
   * Error code
   * @example 139100
   */
  code: number

  /**
   * Additional error details
   */
  error_data?: {
    /**
     * Detailed explanation of the error
     */
    details: string
  }

  /**
   * Facebook trace ID for debugging
   */
  fbtrace_id?: string
}

/**
 * Response from blocking users (POST /{phone-number-id}/block_users)
 */
export interface CloudAPIBlockUsersResponse {
  /**
   * Identifier for the messaging service
   * Always set to 'whatsapp'
   */
  messaging_product: 'whatsapp'

  /**
   * The result of the block operation
   */
  block_users: {
    /**
     * Users that were successfully blocked
     */
    added_users: CloudAPIBlockedUserSuccess[]

    /**
     * Users that could not be blocked
     * Only present when at least one user failed.
     */
    failed_users?: CloudAPIBlockedUserFailure[]
  }

  /**
   * Top-level error
   * Present only on a partial failure (some users failed to block).
   */
  error?: CloudAPIBlockUsersError
}

/**
 * Response from unblocking users (DELETE /{phone-number-id}/block_users)
 */
export interface CloudAPIUnblockUsersResponse {
  /**
   * Identifier for the messaging service
   * Always set to 'whatsapp'
   */
  messaging_product: 'whatsapp'

  /**
   * The result of the unblock operation
   */
  block_users: {
    /**
     * Users that were successfully unblocked
     */
    removed_users: CloudAPIBlockedUserSuccess[]

    /**
     * Users that could not be unblocked
     * Only present when at least one user failed.
     */
    failed_users?: CloudAPIBlockedUserFailure[]
  }

  /**
   * Top-level error
   * Present only on a partial failure (some users failed to unblock).
   */
  error?: CloudAPIBlockUsersError
}

/**
 * A blocked user entry in the list-blocked-users response
 */
export interface CloudAPIBlockedUser {
  /**
   * Identifier for the messaging service
   * Always set to 'whatsapp'
   */
  messaging_product: 'whatsapp'

  /**
   * WhatsApp user ID for the blocked user
   */
  wa_id: string
}

/**
 * Response from listing blocked users (GET /{phone-number-id}/block_users)
 * Paginated via Graph API cursors.
 */
export interface CloudAPIListBlockedUsersResponse {
  /**
   * The currently blocked users
   */
  data: CloudAPIBlockedUser[]

  /**
   * Pagination information
   */
  paging?: {
    /**
     * Cursors for forward / backward pagination
     */
    cursors?: {
      /**
       * Cursor for the start of the current page
       */
      before?: string

      /**
       * Cursor for the end of the current page
       */
      after?: string
    }

    /**
     * URL for the next page of results
     */
    next?: string

    /**
     * URL for the previous page of results
     */
    previous?: string
  }
}
