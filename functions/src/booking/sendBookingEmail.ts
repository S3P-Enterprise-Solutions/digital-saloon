import nodemailer, { type Transporter } from 'nodemailer'
import { Resend } from 'resend'

import { getBrandKey } from '../config'

export type EmailTransport =
  | { kind: 'none' }
  | { kind: 'mailCatcher'; url: string; from: string }
  | {
      kind: 'smtp'
      host: string
      port: number
      secure: boolean
      user: string
      pass: string
      from: string
    }
  | { kind: 'resend'; apiKey: string; from: string }

type EmailEnv = Record<string, string | undefined>

function envValue(env: EmailEnv, name: string): string | undefined {
  const value = env[name]?.trim()
  return value ? value : undefined
}

/**
 * Picks how booking emails are delivered. Priority:
 * Mail-Catcher (local dev) → SMTP (e.g. Gmail app password) → Resend → none.
 */
export function resolveEmailTransport(env: EmailEnv, salonName: string): EmailTransport {
  const mailCatcherUrl = envValue(env, 'MAIL_CATCHER_URL')
  const smtpUser = envValue(env, 'SMTP_USER')
  // Gmail shows app passwords with spaces ("abcd efgh ijkl mnop"); they are not part of it.
  const smtpPass = envValue(env, 'SMTP_PASS')?.replace(/\s+/g, '')
  const resendApiKey = envValue(env, 'RESEND_API_KEY')
  const resendFrom = envValue(env, 'RESEND_FROM_EMAIL') ?? 'onboarding@resend.dev'

  if (mailCatcherUrl) {
    const from = smtpUser ? `"${salonName}" <${smtpUser}>` : resendFrom
    return { kind: 'mailCatcher', url: mailCatcherUrl, from }
  }

  if (smtpUser && smtpPass) {
    const port = Number(envValue(env, 'SMTP_PORT') ?? 465)
    return {
      kind: 'smtp',
      host: envValue(env, 'SMTP_HOST') ?? 'smtp.gmail.com',
      port,
      secure: port === 465,
      user: smtpUser,
      pass: smtpPass,
      from: envValue(env, 'SMTP_FROM') ?? `"${salonName.replace(/"/g, '')}" <${smtpUser}>`,
    }
  }

  if (resendApiKey) {
    return { kind: 'resend', apiKey: resendApiKey, from: resendFrom }
  }

  return { kind: 'none' }
}

let cachedResend: { apiKey: string; client: Resend } | null = null

function getResendClient(apiKey: string): Resend {
  if (!cachedResend || cachedResend.apiKey !== apiKey) {
    cachedResend = { apiKey, client: new Resend(apiKey) }
  }
  return cachedResend.client
}

let cachedSmtp: { key: string; transporter: Transporter } | null = null

function getSmtpTransporter(t: Extract<EmailTransport, { kind: 'smtp' }>): Transporter {
  const key = `${t.host}:${t.port}:${t.user}:${t.pass}`
  if (!cachedSmtp || cachedSmtp.key !== key) {
    cachedSmtp = {
      key,
      transporter: nodemailer.createTransport({
        host: t.host,
        port: t.port,
        secure: t.secure,
        auth: { user: t.user, pass: t.pass },
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      }),
    }
  }
  return cachedSmtp.transporter
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatIcsUtc(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function foldIcsLine(line: string): string {
  const chunks: string[] = []
  let rest = line
  while (rest.length > 75) {
    chunks.push(rest.slice(0, 75))
    rest = ` ${rest.slice(75)}`
  }
  chunks.push(rest)
  return chunks.join('\r\n')
}

export type BookingEmailKind = 'confirmation' | 'cancelled' | 'rescheduled'

export type BookingEmailInput = {
  kind?: BookingEmailKind
  reservationId: string
  to: string
  firstName: string
  lastName: string
  serviceName: string
  durationMinutes: number
  startAt: Date
  status: 'PENDING' | 'CONFIRMED'
  /** Plain token when still known (create / customer manage flows). */
  managementToken?: string | null
  notes: string | null
  locale?: 'de' | 'it'
  timeZone?: string
  salonName?: string
  salonAddress?: string
  salonPhone?: string
}

export const EMAIL_WAIT_TIMEOUT_MS = 2500

export type ReservationScheduleSnapshot = {
  startAt: string
  durationMinutes: number
  serviceIds: string[]
}

export function customerEmailOf(data: Record<string, unknown>): string | null {
  const email = typeof data.email === 'string' ? data.email.trim() : ''
  return email.includes('@') ? email : null
}

export function serviceIdsOf(data: Record<string, unknown>): string[] {
  if (Array.isArray(data.serviceIds) && data.serviceIds.length > 0) {
    return data.serviceIds.map(String)
  }
  const serviceId = data.serviceId
  return typeof serviceId === 'string' && serviceId.trim().length > 0 ? [serviceId.trim()] : []
}

/** True when start time, duration, or service set changed — not contact-only edits. */
export function isReservationScheduleChange(
  before: ReservationScheduleSnapshot,
  after: ReservationScheduleSnapshot,
): boolean {
  if (before.startAt !== after.startAt) return true
  if (before.durationMinutes !== after.durationMinutes) return true
  if (before.serviceIds.length !== after.serviceIds.length) return true
  const left = [...before.serviceIds].sort()
  const right = [...after.serviceIds].sort()
  return left.some((id, index) => id !== right[index])
}

export function buildBookingIcs(input: BookingEmailInput, manageUrl: string | null): string {
  const kind = input.kind ?? 'confirmation'
  const isIt = input.locale === 'it'
  const endAt = new Date(input.startAt.getTime() + input.durationMinutes * 60_000)
  const salonName = input.salonName?.trim() || 'SalonFlow'
  const summary =
    kind === 'cancelled'
      ? isIt
        ? `Annullato: ${input.serviceName} — ${salonName}`
        : `Storniert: ${input.serviceName} — ${salonName}`
      : `${input.serviceName} — ${salonName}`
  const descriptionParts = isIt
    ? [
        `Servizio/i: ${input.serviceName}`,
        `Durata: ${input.durationMinutes} minuti`,
        ...(input.notes ? [`Nota: ${input.notes}`] : []),
        ...(manageUrl ? [`Gestisci appuntamento: ${manageUrl}`] : []),
      ]
    : [
        `Leistung(en): ${input.serviceName}`,
        `Dauer: ${input.durationMinutes} Minuten`,
        ...(input.notes ? [`Notiz: ${input.notes}`] : []),
        ...(manageUrl ? [`Termin verwalten: ${manageUrl}`] : []),
      ]

  const method = kind === 'cancelled' ? 'CANCEL' : 'PUBLISH'
  const eventStatus =
    kind === 'cancelled' ? 'CANCELLED' : input.status === 'CONFIRMED' ? 'CONFIRMED' : 'TENTATIVE'
  // Bump SEQUENCE for updates/cancels so calendar clients replace the original invite.
  const sequence = kind === 'confirmation' ? 0 : 1

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SalonFlow//Booking//DE',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${input.reservationId}@salonflow.local`,
    `DTSTAMP:${formatIcsUtc(new Date())}`,
    `DTSTART:${formatIcsUtc(input.startAt)}`,
    `DTEND:${formatIcsUtc(endAt)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(descriptionParts.join('\n'))}`,
    ...(input.salonAddress ? [`LOCATION:${escapeIcsText(input.salonAddress)}`] : []),
    `STATUS:${eventStatus}`,
    `SEQUENCE:${sequence}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return `${lines.map(foldIcsLine).join('\r\n')}\r\n`
}

function getEmailPalette() {
  if (getBrandKey() === 'salon1500') {
    return {
      canvasBg: '#FAF6F2',
      footerBg: '#FAF6F2',
      primary: '#000000',
      muted: '#54595F',
      accent: '#DFBFA4',
      accentText: '#9A7656',
      border: '#DFBFA4',
      rowBorder: '#EAE2DC',
      confirmedBadgeBg: '#000000',
      confirmedBadgeText: '#DFBFA4',
      fontFamily: "'Roboto Condensed','Helvetica Neue',Arial,sans-serif",
      headingFontFamily: "'Cormorant SC',Georgia,serif",
    }
  }
  return {
    canvasBg: '#F2EEEB',
    footerBg: '#FAF8F7',
    primary: '#4A3631',
    muted: '#7A6862',
    accent: '#E2701F',
    accentText: '#B9540E',
    border: '#E2DCDA',
    rowBorder: '#E8E2DF',
    confirmedBadgeBg: '#E2701F',
    confirmedBadgeText: '#FFFFFF',
    fontFamily: "'Helvetica Neue',Arial,sans-serif",
    headingFontFamily: "'Helvetica Neue',Arial,sans-serif",
  }
}

function buildBookingEmailHtml(input: BookingEmailInput, manageUrl: string | null): string {
  const palette = getEmailPalette()
  const isIt = input.locale === 'it'
  const intlLocale = isIt ? 'it-IT' : 'de-AT'
  const timeZone = input.timeZone ?? 'Europe/Vienna'
  const endAt = new Date(input.startAt.getTime() + input.durationMinutes * 60_000)
  const salonName = input.salonName?.trim() || 'SalonFlow'

  const dateFormatted = new Intl.DateTimeFormat(intlLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  }).format(input.startAt)

  const startTimeFormatted = new Intl.DateTimeFormat(intlLocale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(input.startAt)

  const endTimeFormatted = new Intl.DateTimeFormat(intlLocale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(endAt)

  const kind = input.kind ?? 'confirmation'
  const isConfirmed = input.status === 'CONFIRMED'
  const statusLabel =
    kind === 'cancelled'
      ? isIt
        ? 'Appuntamento annullato'
        : 'Termin storniert'
      : kind === 'rescheduled'
        ? isIt
          ? 'Appuntamento spostato'
          : 'Termin umgebucht'
        : isIt
          ? isConfirmed
            ? 'Appuntamento confermato'
            : 'Richiesta ricevuta'
          : isConfirmed
            ? 'Termin bestätigt'
            : 'Anfrage eingegangen'
  const statusBg =
    kind === 'cancelled'
      ? palette.muted
      : isConfirmed || kind === 'rescheduled'
        ? palette.confirmedBadgeBg
        : palette.primary
  const statusColor =
    kind === 'cancelled'
      ? '#FFFFFF'
      : isConfirmed || kind === 'rescheduled'
        ? palette.confirmedBadgeText
        : '#FFFFFF'
  const introText =
    kind === 'cancelled'
      ? isIt
        ? `Ciao ${escapeHtml(input.firstName)}, il tuo appuntamento è stato annullato.`
        : `Hallo ${escapeHtml(input.firstName)}, Ihr Termin wurde storniert.`
      : kind === 'rescheduled'
        ? isIt
          ? `Ciao ${escapeHtml(input.firstName)}, il tuo appuntamento è stato spostato. Ecco i nuovi dettagli.`
          : `Hallo ${escapeHtml(input.firstName)}, Ihr Termin wurde umgebucht. Hier die neuen Details.`
        : isIt
          ? isConfirmed
            ? `Ciao ${escapeHtml(input.firstName)}, il tuo appuntamento è confermato.`
            : `Ciao ${escapeHtml(input.firstName)}, abbiamo ricevuto la tua richiesta e ti contatteremo a breve.`
          : isConfirmed
            ? `Hallo ${escapeHtml(input.firstName)}, Ihr Termin ist fest für Sie reserviert.`
            : `Hallo ${escapeHtml(input.firstName)}, wir haben Ihre Anfrage erhalten und melden uns in Kürze.`

  const labels = isIt
    ? {
        timeSuffix: '',
        services: 'Servizio/i',
        duration: 'Durata',
        durationValue: `${input.durationMinutes} minuti`,
        address: 'Indirizzo',
        notes: 'La tua nota',
        manageCta: 'Gestisci o annulla appuntamento',
        icsHint:
          kind === 'cancelled'
            ? 'In allegato trovi il file calendario <strong>termin.ics</strong> per rimuovere l’appuntamento dal tuo calendario.'
            : kind === 'rescheduled'
              ? 'In allegato trovi il file calendario aggiornato <strong>termin.ics</strong> con il nuovo orario.'
              : 'In allegato trovi il file calendario <strong>termin.ics</strong> per salvare l’appuntamento direttamente nel tuo calendario.',
      }
    : {
        timeSuffix: ' Uhr',
        services: 'Leistung(en)',
        duration: 'Dauer',
        durationValue: `${input.durationMinutes} Minuten`,
        address: 'Adresse',
        notes: 'Ihre Notiz',
        manageCta: 'Termin verwalten oder stornieren',
        icsHint:
          kind === 'cancelled'
            ? 'Im Anhang finden Sie die Kalenderdatei <strong>termin.ics</strong>, um den Termin aus Ihrem Kalender zu entfernen.'
            : kind === 'rescheduled'
              ? 'Im Anhang finden Sie die aktualisierte Kalenderdatei <strong>termin.ics</strong> mit der neuen Zeit.'
              : 'Im Anhang finden Sie die Kalenderdatei <strong>termin.ics</strong>, um den Termin direkt in Ihren Kalender einzutragen.',
      }

  const notesRow = input.notes
    ? `
      <tr>
        <td style="padding:10px 0;border-top:1px solid ${palette.rowBorder};color:${palette.muted};font-size:13px;vertical-align:top;width:120px;">${labels.notes}</td>
        <td style="padding:10px 0;border-top:1px solid ${palette.rowBorder};color:${palette.primary};font-size:14px;line-height:1.5;">${escapeHtml(input.notes)}</td>
      </tr>`
    : ''

  const addressRow = input.salonAddress
    ? `
      <tr>
        <td style="padding:10px 0;border-top:1px solid ${palette.rowBorder};color:${palette.muted};font-size:13px;vertical-align:top;width:120px;">${labels.address}</td>
        <td style="padding:10px 0;border-top:1px solid ${palette.rowBorder};color:${palette.primary};font-size:14px;">${escapeHtml(input.salonAddress)}</td>
      </tr>`
    : ''

  const manageSection =
    manageUrl && kind !== 'cancelled'
      ? `
      <div style="margin-top:24px;">
        <a href="${escapeHtml(manageUrl)}" style="display:inline-block;background-color:${palette.primary};color:#FFFFFF;text-decoration:none;font-weight:600;font-size:14px;padding:12px 20px;border-radius:2px;">
          ${labels.manageCta}
        </a>
      </div>`
      : ''

  const footerContact = [input.salonAddress, input.salonPhone]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map(escapeHtml)
    .join(' · ')

  return `<!doctype html>
<html lang="${isIt ? 'it' : 'de'}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background-color:${palette.canvasBg};font-family:${palette.fontFamily};color:${palette.primary};-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${palette.canvasBg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#FFFFFF;border:1px solid ${palette.border};border-top:4px solid ${palette.accent};border-radius:4px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 24px 28px;">
              <div style="font-family:${palette.headingFontFamily};font-size:20px;font-weight:700;letter-spacing:0.01em;color:${palette.primary};margin-bottom:20px;">
                ${escapeHtml(salonName)}
              </div>

              <div style="display:inline-block;background-color:${statusBg};color:${statusColor};font-size:12px;font-weight:600;padding:4px 10px;border-radius:2px;margin-bottom:14px;">
                ${statusLabel}
              </div>

              <h1 style="margin:0 0 6px 0;font-family:${palette.headingFontFamily};font-size:22px;line-height:1.25;font-weight:700;color:${palette.primary};">
                ${escapeHtml(dateFormatted)}
              </h1>
              <div style="font-size:16px;font-weight:600;color:${palette.accentText};margin-bottom:16px;font-variant-numeric:tabular-nums;">
                ${escapeHtml(startTimeFormatted)} – ${escapeHtml(endTimeFormatted)}${labels.timeSuffix}
              </div>

              <p style="margin:0 0 22px 0;font-size:15px;line-height:1.55;color:${palette.primary};">
                ${introText}
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 0;border-top:1px solid ${palette.rowBorder};color:${palette.muted};font-size:13px;vertical-align:top;width:120px;">${labels.services}</td>
                  <td style="padding:10px 0;border-top:1px solid ${palette.rowBorder};color:${palette.primary};font-size:14px;font-weight:600;">${escapeHtml(input.serviceName)}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-top:1px solid ${palette.rowBorder};color:${palette.muted};font-size:13px;vertical-align:top;width:120px;">${labels.duration}</td>
                  <td style="padding:10px 0;border-top:1px solid ${palette.rowBorder};color:${palette.primary};font-size:14px;">${labels.durationValue}</td>
                </tr>
                ${addressRow}
                ${notesRow}
              </table>

              ${manageSection}

              <p style="margin:22px 0 0 0;padding:12px 14px;background-color:${palette.canvasBg};border-radius:4px;font-size:13px;line-height:1.5;color:${palette.primary};">
                ${labels.icsHint}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;border-top:1px solid ${palette.rowBorder};background-color:${palette.footerBg};font-size:12px;color:${palette.muted};line-height:1.5;">
              <strong style="color:${palette.primary};">${escapeHtml(salonName)}</strong>${footerContact ? ` · ${footerContact}` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/**
 * Sends one booking lifecycle email (confirmation, cancel, or reschedule).
 * Transport is chosen by `resolveEmailTransport` (Mail-Catcher → SMTP → Resend);
 * no-ops when nothing is configured, and never throws.
 */
export async function sendBookingLifecycleEmail(input: BookingEmailInput): Promise<void> {
  const kind = input.kind ?? 'confirmation'
  const salonName = input.salonName?.trim() || 'SalonFlow'
  const transport = resolveEmailTransport(process.env, salonName)
  if (transport.kind === 'none') {
    return
  }

  const from = transport.from
  const isIt = input.locale === 'it'
  const timeZone = input.timeZone ?? 'Europe/Vienna'
  const whenFormatted = new Intl.DateTimeFormat(isIt ? 'it-IT' : 'de-AT', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(input.startAt)

  const isConfirmed = input.status === 'CONFIRMED'
  const subject = isIt
    ? kind === 'cancelled'
      ? `${salonName}: Appuntamento annullato del ${whenFormatted}`
      : kind === 'rescheduled'
        ? `${salonName}: Appuntamento spostato al ${whenFormatted}`
        : isConfirmed
          ? `${salonName}: Conferma appuntamento del ${whenFormatted}`
          : `${salonName}: Richiesta di appuntamento del ${whenFormatted}`
    : kind === 'cancelled'
      ? `${salonName}: Termin storniert am ${whenFormatted}`
      : kind === 'rescheduled'
        ? `${salonName}: Termin umgebucht auf ${whenFormatted}`
        : isConfirmed
          ? `${salonName}: Terminbestätigung am ${whenFormatted}`
          : `${salonName}: Terminanfrage am ${whenFormatted}`

  const publicBaseUrl = process.env.PUBLIC_APP_URL?.trim().replace(/\/+$/, '')
  const token = input.managementToken?.trim()
  const manageUrl =
    publicBaseUrl && token ? `${publicBaseUrl}/manage/${encodeURIComponent(token)}` : null

  const html = buildBookingEmailHtml({ ...input, kind }, manageUrl)
  const icsContent = buildBookingIcs({ ...input, kind }, manageUrl)
  const icsBase64 = Buffer.from(icsContent, 'utf8').toString('base64')
  const icsContentType = `text/calendar; charset=utf-8; method=${kind === 'cancelled' ? 'CANCEL' : 'PUBLISH'}`

  try {
    if (transport.kind === 'mailCatcher') {
      const response = await fetch(transport.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: input.to,
          subject,
          html,
          attachments: [
            {
              filename: 'termin.ics',
              contentType: icsContentType,
              content: icsBase64,
            },
          ],
        }),
      })
      if (!response.ok) {
        console.error('[email] Mail-Catcher returned HTTP', response.status)
      }
      return
    }

    if (transport.kind === 'smtp') {
      await getSmtpTransporter(transport).sendMail({
        from,
        to: input.to,
        subject,
        html,
        attachments: [
          {
            filename: 'termin.ics',
            content: icsContent,
            contentType: icsContentType,
          },
        ],
      })
      return
    }

    const response = await getResendClient(transport.apiKey).emails.send({
      from,
      to: input.to,
      subject,
      html,
      attachments: [
        {
          filename: 'termin.ics',
          content: Buffer.from(icsContent, 'utf8'),
          contentType: icsContentType,
        },
      ],
    })
    if (response.error) {
      console.error('[email] Resend returned an error:', response.error)
    }
  } catch (error) {
    console.error('[email] Failed to send booking email:', error)
  }
}

/** @deprecated Prefer `sendBookingLifecycleEmail`; kept for create-reservation call sites. */
export async function sendBookingConfirmationEmail(input: BookingEmailInput): Promise<void> {
  await sendBookingLifecycleEmail({ ...input, kind: input.kind ?? 'confirmation' })
}

/** Caps wait so callables stay responsive if SMTP/Resend is slow. */
export async function sendBookingEmailWithBudget(input: BookingEmailInput): Promise<void> {
  await Promise.race([
    sendBookingLifecycleEmail(input),
    new Promise<void>((resolve) => {
      setTimeout(resolve, EMAIL_WAIT_TIMEOUT_MS)
    }),
  ])
}
