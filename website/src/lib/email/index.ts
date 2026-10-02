import nodemailer, { type Transporter } from 'nodemailer'
import { logger } from '@/lib/logger'

/**
 * Outgoing email over SMTP (Gmail with an App Password in production). Settings come only from the environment:
 *   MAIL_USERNAME, MAIL_PASSWORD   SMTP login (Gmail address + 16-character App Password)
 *   MAIL_FROM                      sender address (defaults to MAIL_USERNAME); MAIL_FROM_NAME display name
 *   MAIL_SERVER (smtp.gmail.com), MAIL_PORT (587), MAIL_STARTTLS (true), MAIL_REPLY_TO (optional)
 * Emails are not sent from request handlers: they are queued in the Email outbox (see ./outbox.ts).
 */
export interface EmailPayload {
  to: string
  subject: string
  html: string
  text?: string
}

export type SendResult = { messageId: string }

const env = (k: string) => (process.env[k] || '').trim()

export function mailConfig() {
  const port = Number(env('MAIL_PORT') || 587)
  return {
    host: env('MAIL_SERVER') || 'smtp.gmail.com',
    port,
    starttls: env('MAIL_STARTTLS').toLowerCase() !== 'false',
    user: env('MAIL_USERNAME'),
    pass: env('MAIL_PASSWORD'),
    from: env('MAIL_FROM') || env('MAIL_USERNAME'),
    fromName: env('MAIL_FROM_NAME') || 'AURIX 2026 · Kalam Robotics Society',
    replyTo: env('MAIL_REPLY_TO') || undefined,
  }
}

/** True when a username, password and sender are set; until then queued emails simply wait. */
export const isMailConfigured = () => {
  const c = mailConfig()
  return Boolean(c.user && c.pass && c.from)
}

let transporter: Transporter | null = null
function getTransporter(): Transporter {
  if (!transporter) {
    const c = mailConfig()
    transporter = nodemailer.createTransport({
      host: c.host,
      port: c.port,
      secure: c.port === 465, // implicit TLS only on 465; 587 upgrades with STARTTLS
      requireTLS: c.starttls, // never send the password over an unencrypted connection
      auth: { user: c.user, pass: c.pass },
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      socketTimeout: 30_000,
    })
  }
  return transporter
}

/** Sends one email; throws on any SMTP error (the outbox records it and retries). */
export async function sendEmail(payload: EmailPayload): Promise<SendResult> {
  if (!isMailConfigured()) throw new Error('Email is not configured (MAIL_USERNAME / MAIL_PASSWORD / MAIL_FROM)')
  const c = mailConfig()
  const info = await getTransporter().sendMail({
    from: { name: c.fromName, address: c.from },
    replyTo: c.replyTo,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  })
  logger.info(`Email sent to ${payload.to}: ${payload.subject} (${info.messageId})`)
  return { messageId: String(info.messageId || '') }
}
