import { CloudAPIRecipientAddressing } from '@whatsapp-cloudapi/types/cloudapi'

/**
 * Builds the `to` / `recipient` addressing for an outbound message, enforcing
 * that at least one is provided. When both are present they are both included
 * and `to` takes precedence (matching the Cloud API). Throws if neither is
 * provided.
 *
 * @param to - Recipient phone number / phone number ID
 * @param recipient - Recipient business-scoped user ID (BSUID)
 * @returns The addressing fragment to spread into a message request
 */
export const buildRecipient = (
  to: string | undefined,
  recipient: string | undefined,
): CloudAPIRecipientAddressing => {
  if (to) {
    return recipient ? { to, recipient } : { to }
  }

  if (recipient) {
    return { recipient }
  }

  throw new Error('Either "to" or "recipient" is required')
}
