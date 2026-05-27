import type {
  CloudAPIBlockUsersRequest,
  CloudAPIBlockUsersResponse,
  CloudAPIListBlockedUsersResponse,
  CloudAPIUnblockUsersResponse,
} from '@whatsapp-cloudapi/types/cloudapi'
import type { Request, Response } from 'express'
import type { EmulatorLogger } from '../services/Logger.js'
import { normalizeWhatsAppId } from '../utils/phoneUtils.js'

export class BlockRoutes {
  private blockedUsers = new Set<string>()
  private logger: EmulatorLogger

  constructor(logger: EmulatorLogger) {
    this.logger = logger
  }

  /**
   * Validates the block/unblock request body and returns its entries, or sends
   * a 400 and returns null.
   */
  private parseUsers(
    req: Request,
    res: Response,
  ): CloudAPIBlockUsersRequest['block_users'] | null {
    const body = req.body as Partial<CloudAPIBlockUsersRequest>

    if (!Array.isArray(body.block_users) || body.block_users.length === 0) {
      this.logger.validationError({
        field: 'block_users',
        reason: 'A non-empty "block_users" array is required',
      })

      res.status(400).json({
        error: {
          message: 'A non-empty "block_users" array is required',
          type: 'ValidationError',
          code: 400,
        },
      })

      return null
    }

    return body.block_users
  }

  public handleBlock(req: Request, res: Response): void {
    const entries = this.parseUsers(req, res)
    if (!entries) {
      return
    }

    const addedUsers = entries.map((entry) => {
      const waId = normalizeWhatsAppId(entry.user)
      this.blockedUsers.add(waId)
      return { input: entry.user, wa_id: waId }
    })

    this.logger.blockOperation(
      'block',
      addedUsers.map((u) => u.wa_id).join(', '),
    )

    const response: CloudAPIBlockUsersResponse = {
      messaging_product: 'whatsapp',
      block_users: {
        added_users: addedUsers,
      },
    }

    res.status(200).json(response)
  }

  public handleUnblock(req: Request, res: Response): void {
    const entries = this.parseUsers(req, res)
    if (!entries) {
      return
    }

    const removedUsers = entries.map((entry) => {
      const waId = normalizeWhatsAppId(entry.user)
      this.blockedUsers.delete(waId)
      return { input: entry.user, wa_id: waId }
    })

    this.logger.blockOperation(
      'unblock',
      removedUsers.map((u) => u.wa_id).join(', '),
    )

    const response: CloudAPIUnblockUsersResponse = {
      messaging_product: 'whatsapp',
      block_users: {
        removed_users: removedUsers,
      },
    }

    res.status(200).json(response)
  }

  public handleList(_req: Request, res: Response): void {
    const response: CloudAPIListBlockedUsersResponse = {
      data: Array.from(this.blockedUsers).map((waId) => ({
        messaging_product: 'whatsapp',
        wa_id: waId,
      })),
      paging: {
        cursors: {},
      },
    }

    res.status(200).json(response)
  }

  /**
   * Returns the current set of blocked user IDs (for tests / inspection).
   */
  public getBlockedUsers(): Set<string> {
    return this.blockedUsers
  }
}
