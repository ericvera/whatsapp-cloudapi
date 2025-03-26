import type {
  CloudAPIErrorResponse,
  CloudAPIVersion,
} from '@whatsapp-cloudapi/types/cloudapi'

export const SupportedVersion: CloudAPIVersion = 'v22.0'

export const UnsupportedVersionError: CloudAPIErrorResponse = {
  error: {
    message: `This version is not supported. Supported version: ${SupportedVersion}`,
    type: 'UnsupportedVersion',
    code: 400,
    error_subcode: 1,
    error_data: {
      messaging_product: 'whatsapp',
      details:
        'Please update your API version to continue using the WhatsApp Business API',
    },
  },
}
