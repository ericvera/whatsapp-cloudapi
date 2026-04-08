/**
 * WhatsApp Cloud API constants
 */

/**
 * Default base URL for the WhatsApp Cloud API
 */
export const WhatsAppCloudAPIBaseUrl = 'https://graph.facebook.com'

/**
 * WhatsApp Cloud API version
 */
export const WhatsAppCloudAPIVersion = 'v24.0'

/**
 * WhatsApp Flow message version
 * Currently only version 3 is supported by the WhatsApp Cloud API
 */
export const WhatsAppFlowMessageVersion = '3'

// Text

export const TextBodyMaxLength = 4096

// Interactive (shared across buttons, list, CTA URL, flow)

export const InteractiveBodyMaxLength = 1024
export const InteractiveHeaderTextMaxLength = 60
export const InteractiveFooterMaxLength = 60

// Media

export const MediaCaptionMaxLength = 1024
export const ImageMaxFileSize = 5 * 1024 * 1024
export const ImageSupportedMimeTypes = ['image/jpeg', 'image/png'] as const

// Buttons (reply buttons)

export const ButtonTextMaxLength = 20
export const ButtonIdMaxLength = 256
export const ButtonsMinCount = 1
export const ButtonsMaxCount = 3

// List

export const ListButtonTextMaxLength = 20
export const ListSectionTitleMaxLength = 24
export const ListSectionsMinCount = 1
export const ListRowIdMaxLength = 200
export const ListRowTitleMaxLength = 24
export const ListRowDescriptionMaxLength = 72
export const ListRowsMaxCount = 10
export const ListRowsPerSectionMinCount = 1

// Callback

export const CallbackDataMaxLength = 512
