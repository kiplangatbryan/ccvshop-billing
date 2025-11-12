import nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'
import { logger } from './logger'

type Mailer = ReturnType<typeof nodemailer.createTransport>

let transporter: Mailer | null = null

function getTransportOptions(config: ReturnType<typeof useRuntimeConfig>): SMTPTransport.Options {
  const { smtpHost, smtpPort, smtpUser, smtpPassword } = config

  if (!smtpHost) {
    throw new Error('SMTP host is not configured')
  }

  const options: SMTPTransport.Options = {
    host: smtpHost,
    port: smtpPort || 587,
    secure: smtpPort === 465,
    auth: undefined
  }

  if (smtpUser && smtpPassword) {
    options.auth = {
      user: smtpUser,
      pass: smtpPassword
    }
  }

  return options
}

export function getMailer(): Mailer {
  const config = useRuntimeConfig()

  if (!transporter) {
    transporter = nodemailer.createTransport(getTransportOptions(config))
  }

  return transporter
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export async function sendEmail(options: SendEmailOptions) {
  const config = useRuntimeConfig()
  const mailer = getMailer()
  const log = logger.child({
    context: {
      service: 'mail',
      to: options.to,
      subject: options.subject
    }
  })

  try {
    const result = await mailer.sendMail({
      from: config.smtpFromEmail,
      ...options
    })

    log.info('Email sent', { metadata: { messageId: result.messageId } })
    return result
  } catch (error) {
    log.error('Failed to send email', { error })
    throw error
  }
}


