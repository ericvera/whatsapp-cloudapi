/**
 * Normalizes a WhatsApp ID by removing the leading '+' if present.
 * WhatsApp IDs should always be in the format without the '+' prefix.
 *
 * @param phoneId - The phone ID to normalize (may or may not have '+' prefix)
 * @returns The normalized phone ID without '+' prefix
 *
 * @example
 * normalizeWhatsAppId('+1234567890') // returns '1234567890'
 * normalizeWhatsAppId('1234567890')  // returns '1234567890'
 */
export function normalizeWhatsAppId(phoneId: string): string {
  return phoneId.startsWith('+') ? phoneId.slice(1) : phoneId
}
