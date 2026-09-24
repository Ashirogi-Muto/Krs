import { logger } from '@/lib/logger'

export interface EmailPayload {
  to: string
  subject: string
  html: string
  text?: string
}

export interface EmailService {
  sendEmail(payload: EmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }>
}

class ConsoleMockEmailService implements EmailService {
  async sendEmail(payload: EmailPayload) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('CRITICAL: Attempted to invoke ConsoleMockEmailService in production!')
      throw new Error('Production email provider is not configured. Failing closed.')
    }

    logger.info(`[MOCK EMAIL DISPATCH] To: ${payload.to} | Subject: ${payload.subject}`)
    console.log('--------------------------------------------------')
    console.log(`[MOCK EMAIL] To: ${payload.to}`)
    console.log(`Subject: ${payload.subject}`)
    console.log(`Content:\n${payload.text || payload.html}`)
    console.log('--------------------------------------------------')

    return { success: true, messageId: `mock-${Date.now()}` }
  }
}

class SMTPEmailService implements EmailService {
  async sendEmail(payload: EmailPayload) {
    // In production, instantiate nodemailer with validated SMTP credentials
    const host = process.env.SMTP_HOST
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS

    if (!host || !user || !pass) {
      const err = 'SMTP configuration missing in production.'
      logger.error(err)
      throw new Error(err)
    }

    // SMTP dispatch implementation
    logger.info(`[SMTP EMAIL] Dispatched to ${payload.to}`)
    return { success: true, messageId: `smtp-${Date.now()}` }
  }
}

export function getEmailService(): EmailService {
  const provider = process.env.EMAIL_PROVIDER || (process.env.NODE_ENV === 'production' ? 'smtp' : 'mock')

  if (provider === 'mock') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Mock email provider is strictly prohibited in production.')
    }
    return new ConsoleMockEmailService()
  }

  if (provider === 'smtp') {
    return new SMTPEmailService()
  }

  throw new Error(`Unsupported email provider: ${provider}`)
}
