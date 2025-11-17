import pc from 'picocolors'
import { Formatter } from 'picocolors/types.js'
import type {
  EmulatorLogConfig,
  ErrorDetails,
  LogCategory,
  ShutdownStats,
  StartupInfo,
} from '../types/logging.js'

const BubbleWidth = 55
const SentIndent = 8

interface MessageContext {
  direction: 'sent' | 'received'
  recipient?: string
  sender?: string
  senderName?: string
  messageId?: string
}

export class EmulatorLogger {
  private config: EmulatorLogConfig
  private startTime: number = Date.now()
  private stats = {
    messagesSent: 0,
    messagesReceived: 0,
    webhooksDelivered: 0,
    webhooksFailed: 0,
  }

  constructor(config: Partial<EmulatorLogConfig> = {}) {
    this.config = {
      level: config.level ?? 'quiet',
    }
  }

  private shouldLog(category: LogCategory): boolean {
    const { level } = this.config

    switch (level) {
      case 'quiet':
        return ['message', 'system', 'error'].includes(category)

      case 'normal':
        return ['message', 'webhook', 'system', 'error'].includes(category)

      case 'verbose':
        return true

      default:
        return false
    }
  }

  private useColors(): boolean {
    return process.stdout.isTTY || false
  }

  private formatTime(): string {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')

    return `${hours}:${minutes}`
  }

  private colorize(text: string, color: keyof typeof pc): string {
    if (!this.useColors()) {
      return text
    }

    const colorFn = pc[color] as Formatter

    if (typeof colorFn === 'function') {
      return colorFn(text)
    }

    return text
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word
      } else {
        if (currentLine) {
          lines.push(currentLine)
        }

        currentLine = word
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    return lines
  }

  private renderBubble(
    lines: string[],
    context: MessageContext,
    timestamp?: string,
  ): string {
    const indent = context.direction === 'sent' ? ' '.repeat(SentIndent) : ''
    const output: string[] = []

    // Top border
    output.push(indent + '╭' + '─'.repeat(BubbleWidth - 2) + '╮')

    // Content lines
    for (let i = 0; i < lines.length; i++) {
      const isLast = i === lines.length - 1
      const line = lines[i] ?? ''

      if (isLast && timestamp) {
        const timeStr = this.colorize(timestamp, 'gray')
        const padding = BubbleWidth - 4 - line.length - timestamp.length

        if (padding >= 2) {
          // Timestamp fits on same line
          output.push(
            indent + '│ ' + line + ' '.repeat(padding) + timeStr + ' │',
          )
        } else {
          // Not enough space, put timestamp on next line
          output.push(indent + '│ ' + line.padEnd(BubbleWidth - 4) + ' │')
          output.push(
            indent +
              '│ ' +
              ' '.repeat(BubbleWidth - 4 - timestamp.length) +
              timeStr +
              ' │',
          )
        }
      } else {
        output.push(indent + '│ ' + line.padEnd(BubbleWidth - 4) + ' │')
      }
    }

    // Bottom border
    output.push(indent + '╰' + '─'.repeat(BubbleWidth - 2) + '╯')

    return output.join('\n')
  }

  private renderButton(text: string, id: string): string {
    const content = `${text} [${id}]`
    const padding = BubbleWidth - 8 - content.length
    const paddedContent = content + ' '.repeat(Math.max(0, padding))

    return (
      '  ╔' +
      '═'.repeat(BubbleWidth - 6) +
      '╗\n' +
      '  ║ ' +
      paddedContent +
      ' ║\n' +
      '  ╚' +
      '═'.repeat(BubbleWidth - 6) +
      '╝'
    )
  }

  private addHeaderLine(lines: string[], context: MessageContext): void {
    if (context.direction === 'sent') {
      lines.push(`To: ${context.recipient ?? ''}`)
    } else {
      const from = context.senderName
        ? `${context.sender ?? ''} (${context.senderName})`
        : (context.sender ?? '')
      lines.push(`From: ${from}`)
    }
  }

  private incrementMessageStats(context: MessageContext): void {
    if (context.direction === 'sent') {
      this.stats.messagesSent++
    } else {
      this.stats.messagesReceived++
    }
  }

  private addInteractiveContent(
    lines: string[],
    header: string | undefined,
    body: string,
    footer: string | undefined,
  ): void {
    // Message header (bold)
    if (header) {
      const headerLines = this.wrapText(header, BubbleWidth - 4)

      for (const line of headerLines) {
        lines.push(this.colorize(line, 'bold'))
      }

      lines.push('')
    }

    // Message body
    const bodyLines = this.wrapText(body, BubbleWidth - 4)
    lines.push(...bodyLines)

    // Message footer (gray)
    if (footer) {
      lines.push('')

      const footerLines = this.wrapText(footer, BubbleWidth - 4)

      for (const line of footerLines) {
        lines.push(this.colorize(line, 'gray'))
      }
    }
  }

  private renderMessage(lines: string[], context: MessageContext): void {
    const timestamp = this.formatTime()
    console.log(this.renderBubble(lines, context, timestamp))
    console.log()
  }

  startup(info: StartupInfo): void {
    if (!this.shouldLog('system')) {
      return
    }

    console.log()
    console.log(this.colorize('━'.repeat(60), 'cyan'))
    console.log(this.colorize('  WhatsApp Cloud API Emulator', 'cyan'))
    console.log(this.colorize('━'.repeat(60), 'cyan'))
    console.log()

    console.log(`  ${this.colorize('Address:', 'bold')}     ${info.address}`)
    console.log(`  ${this.colorize('Phone:', 'bold')}       ${info.phone}`)
    console.log(`  ${this.colorize('Phone ID:', 'bold')}    ${info.phoneId}`)

    if (info.webhook) {
      console.log(`  ${this.colorize('Webhook:', 'bold')}     ${info.webhook}`)
    }

    if (info.mediaPersistence) {
      console.log(
        `  ${this.colorize('Media:', 'bold')}       ${info.mediaPersistence}`,
      )
    }

    console.log()
    console.log(this.colorize('━'.repeat(60), 'cyan'))
    console.log()
  }

  shutdown(stats?: ShutdownStats): void {
    if (!this.shouldLog('system')) {
      return
    }

    const actualStats: ShutdownStats = stats ?? {
      messagesSent: this.stats.messagesSent,
      messagesReceived: this.stats.messagesReceived,
      webhooksDelivered: this.stats.webhooksDelivered,
      webhooksFailed: this.stats.webhooksFailed,
      uptime: this.formatUptime(),
    }

    console.log()
    console.log(this.colorize('━'.repeat(60), 'cyan'))
    console.log(this.colorize('  Emulator Statistics', 'cyan'))
    console.log(this.colorize('━'.repeat(60), 'cyan'))
    console.log()

    console.log(
      `  ${this.colorize('Messages sent:', 'bold')}       ${actualStats.messagesSent.toString()}`,
    )
    console.log(
      `  ${this.colorize('Messages received:', 'bold')}   ${actualStats.messagesReceived.toString()}`,
    )
    console.log(
      `  ${this.colorize('Webhooks delivered:', 'bold')}  ${actualStats.webhooksDelivered.toString()}`,
    )
    console.log(
      `  ${this.colorize('Webhooks failed:', 'bold')}     ${actualStats.webhooksFailed.toString()}`,
    )
    console.log(
      `  ${this.colorize('Uptime:', 'bold')}              ${actualStats.uptime}`,
    )

    console.log()
    console.log(this.colorize('━'.repeat(60), 'cyan'))
    console.log()
  }

  private formatUptime(): string {
    const uptimeMs = Date.now() - this.startTime
    const seconds = Math.floor(uptimeMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours.toString()}h ${(minutes % 60).toString()}m ${(seconds % 60).toString()}s`
    }

    if (minutes > 0) {
      return `${minutes.toString()}m ${(seconds % 60).toString()}s`
    }

    return `${seconds.toString()}s`
  }

  textMessage(text: string, context: MessageContext): void {
    if (!this.shouldLog('message')) {
      return
    }

    this.incrementMessageStats(context)

    const lines: string[] = []
    this.addHeaderLine(lines, context)
    lines.push('')

    // Message text
    const textLines = this.wrapText(text, BubbleWidth - 4)
    lines.push(...textLines)

    this.renderMessage(lines, context)
  }

  interactiveButtonMessage(
    header: string | undefined,
    body: string,
    footer: string | undefined,
    buttons: { id: string; title: string }[],
    context: MessageContext,
  ): void {
    if (!this.shouldLog('message')) {
      return
    }

    this.incrementMessageStats(context)

    const lines: string[] = []
    this.addHeaderLine(lines, context)
    lines.push('')

    this.addInteractiveContent(lines, header, body, footer)
    lines.push('')

    // Buttons
    for (const button of buttons) {
      const buttonStr = this.renderButton(button.title, button.id)
      lines.push(buttonStr)
    }

    this.renderMessage(lines, context)
  }

  interactiveListMessage(
    header: string | undefined,
    body: string,
    footer: string | undefined,
    buttonText: string,
    sections: {
      title?: string
      rows: { id: string; title: string; description?: string }[]
    }[],
    context: MessageContext,
  ): void {
    if (!this.shouldLog('message')) {
      return
    }

    this.incrementMessageStats(context)

    const lines: string[] = []
    this.addHeaderLine(lines, context)
    lines.push('')

    this.addInteractiveContent(lines, header, body, footer)

    // List button
    lines.push('')
    lines.push('─'.repeat(BubbleWidth - 4))
    lines.push(this.colorize(`▼ ${buttonText}`, 'cyan'))
    lines.push('─'.repeat(BubbleWidth - 4))

    // List sections
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i]
      if (!section) {
        continue
      }

      if (section.title) {
        lines.push('')
        lines.push(this.colorize(section.title.toUpperCase(), 'gray'))
      }

      for (const row of section.rows) {
        lines.push('')
        lines.push(`• ${row.title}`)

        if (row.description) {
          const descLines = this.wrapText(row.description, BubbleWidth - 6)
          for (const descLine of descLines) {
            lines.push(this.colorize(`  ${descLine}`, 'gray'))
          }
        }

        lines.push(this.colorize(`  [${row.id}]`, 'gray'))
      }

      if (i < sections.length - 1) {
        lines.push('')
        lines.push('─'.repeat(BubbleWidth - 4))
      }
    }

    this.renderMessage(lines, context)
  }

  imageMessage(
    caption: string | undefined,
    mediaId: string,
    context: MessageContext,
  ): void {
    if (!this.shouldLog('message')) {
      return
    }

    this.incrementMessageStats(context)

    const lines: string[] = []
    this.addHeaderLine(lines, context)
    lines.push('')
    lines.push(this.colorize('📷 [Image]', 'cyan'))

    if (caption) {
      lines.push('')
      const captionLines = this.wrapText(caption, BubbleWidth - 4)
      lines.push(...captionLines)
    }

    if (this.config.level === 'verbose') {
      lines.push('')
      lines.push(this.colorize(`Media ID: ${mediaId}`, 'gray'))
    }

    this.renderMessage(lines, context)
  }

  reactionMessage(
    emoji: string,
    messageId: string,
    context: MessageContext,
  ): void {
    if (!this.shouldLog('message')) {
      return
    }

    this.incrementMessageStats(context)

    const lines: string[] = []
    this.addHeaderLine(lines, context)
    lines.push('')
    lines.push(`Reacted with ${emoji}`)

    if (this.config.level === 'verbose') {
      lines.push('')
      lines.push(this.colorize(`Message ID: ${messageId}`, 'gray'))
    }

    this.renderMessage(lines, context)
  }

  markAsRead(
    messageId: string,
    context: MessageContext,
    showTypingIndicator?: boolean,
  ): void {
    if (!this.shouldLog('message')) {
      return
    }

    const lines: string[] = []
    this.addHeaderLine(lines, context)
    lines.push('')
    lines.push(this.colorize('✓✓ Marked as read', 'cyan'))

    if (showTypingIndicator) {
      lines.push(this.colorize('💬 Typing...', 'cyan'))
    }

    if (this.config.level === 'verbose') {
      lines.push('')
      lines.push(this.colorize(`Message ID: ${messageId}`, 'gray'))
    }

    this.renderMessage(lines, context)
  }

  typingIndicator(context: MessageContext): void {
    if (!this.shouldLog('message')) {
      return
    }

    const lines: string[] = []
    this.addHeaderLine(lines, context)
    lines.push('')
    lines.push(this.colorize('💬 Typing...', 'cyan'))

    this.renderMessage(lines, context)
  }

  unsupportedMessage(
    messageType: string,
    body: unknown,
    context: MessageContext,
  ): void {
    if (!this.shouldLog('message')) {
      return
    }

    this.incrementMessageStats(context)

    const lines: string[] = []
    this.addHeaderLine(lines, context)
    lines.push('')
    lines.push(
      this.colorize(`⚠️  Unsupported message type: ${messageType}`, 'yellow'),
    )

    if (this.config.level === 'verbose') {
      lines.push('')
      lines.push(this.colorize('Raw message:', 'gray'))

      const jsonLines = JSON.stringify(body, null, 2).split('\n')
      for (const jsonLine of jsonLines) {
        lines.push(this.colorize(jsonLine, 'gray'))
      }
    }

    this.renderMessage(lines, context)
  }

  webhookDelivered(url: string, status: number, duration: number): void {
    if (!this.shouldLog('webhook')) {
      return
    }

    this.stats.webhooksDelivered++

    const statusStr = this.colorize(status.toString(), 'green')
    const durationStr = this.colorize(`(${duration.toString()}ms)`, 'gray')

    console.log(
      `${this.colorize('→', 'green')} Webhook delivered: ${statusStr} ${durationStr}`,
    )

    if (this.config.level === 'verbose') {
      console.log(this.colorize(`  ${url}`, 'gray'))
    }

    console.log()
  }

  webhookFailed(url: string, error: string): void {
    if (!this.shouldLog('webhook')) {
      return
    }

    this.stats.webhooksFailed++

    console.log(
      `${this.colorize('✕', 'red')} Webhook failed: ${this.colorize(error, 'red')}`,
    )

    if (this.config.level === 'verbose') {
      console.log(this.colorize(`  ${url}`, 'gray'))
    }

    console.log()
  }

  httpRequest(
    method: string,
    path: string,
    status: number,
    duration: number,
  ): void {
    if (!this.shouldLog('http')) {
      return
    }

    const statusColor =
      status >= 400 ? 'red' : status >= 300 ? 'yellow' : 'green'
    const methodStr = this.colorize(method.padEnd(6), 'cyan')
    const statusStr = this.colorize(status.toString(), statusColor)
    const durationStr = this.colorize(`${duration.toString()}ms`, 'gray')

    console.log(`${methodStr} ${path.padEnd(40)} ${statusStr} ${durationStr}`)
  }

  mediaOperation(
    operation: string,
    mediaId: string,
    details?: string | Record<string, unknown>,
  ): void {
    if (!this.shouldLog('media')) {
      return
    }

    console.log(`${this.colorize('📁', 'cyan')} Media ${operation}: ${mediaId}`)

    if (details && this.config.level === 'verbose') {
      const detailsStr =
        typeof details === 'string' ? details : JSON.stringify(details)
      console.log(this.colorize(`   ${detailsStr}`, 'gray'))
    }

    console.log()
  }

  validationError(error: ErrorDetails): void {
    if (!this.shouldLog('validation')) {
      return
    }

    console.log(this.colorize('⚠ Validation Error', 'yellow'))

    if (error.field) {
      console.log(this.colorize(`  Field: ${error.field}`, 'yellow'))
    }

    if (error.reason) {
      console.log(this.colorize(`  Reason: ${error.reason}`, 'yellow'))
    }

    if (error.details) {
      console.log(this.colorize(`  Details: ${error.details}`, 'gray'))
    }

    console.log()
  }

  error(message: string, details?: ErrorDetails): void {
    if (!this.shouldLog('error')) {
      return
    }

    console.log(this.colorize(`✕ Error: ${message}`, 'red'))

    if (details) {
      if (details.recipient) {
        console.log(this.colorize(`  Recipient: ${details.recipient}`, 'gray'))
      }

      if (details.reason) {
        console.log(this.colorize(`  Reason: ${details.reason}`, 'gray'))
      }

      if (details.details) {
        console.log(this.colorize(`  Details: ${details.details}`, 'gray'))
      }

      if (details.messageId) {
        console.log(this.colorize(`  Message ID: ${details.messageId}`, 'gray'))
      }
    }

    console.log()
  }

  incrementMessagesSent(): void {
    this.stats.messagesSent++
  }

  incrementMessagesReceived(): void {
    this.stats.messagesReceived++
  }

  incrementWebhooksDelivered(): void {
    this.stats.webhooksDelivered++
  }

  incrementWebhooksFailed(): void {
    this.stats.webhooksFailed++
  }

  getStats() {
    return {
      ...this.stats,
      uptime: this.formatUptime(),
    }
  }
}
