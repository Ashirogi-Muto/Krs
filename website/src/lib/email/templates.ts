/**
 * Email templates. Table-based HTML with inline styles (works in Gmail, Outlook and phone mail apps),
 * plus a plain-text version. Only data that the registration actually has is used.
 */
import { DEFAULT_FORM_TEXTS, fill, type FormTexts } from '@/lib/form-texts-defaults'

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || 'https://kalamroboticssociety.com'

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const inr = (n: number | null | undefined) => (n || n === 0 ? `₹${Number(n).toLocaleString('en-IN')}` : '')
const dateIST = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }) : ''

export type ConfirmationData = {
  registrationCode: string
  teamName: string
  leaderName: string
  leaderEmail: string
  leaderPhone: string
  college: string
  members: { name: string; college: string }[]
  event: { title: string; slug: string; startDate?: string | null; endDate?: string | null; venue?: string | null }
  amountDue?: number | null
  paymentUrl?: string | null
}

export type EmailTexts = FormTexts['emails']
const DEFAULT_EMAIL_TEXTS = DEFAULT_FORM_TEXTS.emails

/**
 * Fill a CMS sentence for the HTML version: the sentence itself is escaped, then each {placeholder} gets its value
 * (values are escaped too unless they are trusted HTML built here, e.g. the bold team name or a link).
 */
const fillHtml = (sentence: string, vars: Record<string, string>) =>
  esc(sentence).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m))

export function registrationConfirmation(d: ConfirmationData, t: EmailTexts = DEFAULT_EMAIL_TEXTS) {
  const site = SITE()
  const statusUrl = `${site}/aurix/status`
  const receiptUrl = `${site}/aurix/payment-done`
  const eventUrl = `${site}/aurix/${d.event.slug}`
  const dates = d.event.startDate
    ? dateIST(d.event.endDate) && dateIST(d.event.endDate) !== dateIST(d.event.startDate)
      ? `${dateIST(d.event.startDate)} – ${dateIST(d.event.endDate)}`
      : dateIST(d.event.startDate)
    : ''
  const subject = fill(t.regSubject, { event: d.event.title, code: d.registrationCode })
  const siteHost = site.replace(/^https?:\/\//, '')
  const statusHost = statusUrl.replace(/^https?:\/\//, '')

  const row = (label: string, value: string) =>
    value
      ? `<tr><td style="padding:6px 0;color:#8b8ba7;font-size:13px;width:150px;vertical-align:top">${esc(label)}</td><td style="padding:6px 0;color:#f1f5f9;font-size:14px">${value}</td></tr>`
      : ''
  const members = d.members
    .map((m, i) => `<li style="margin:0 0 4px">${esc(m.name)}${i === 0 ? esc(t.leaderSuffix) : ''} <span style="color:#8b8ba7">· ${esc(m.college)}</span></li>`)
    .join('')
  const pay =
    d.paymentUrl && d.amountDue
      ? `<p style="margin:24px 0 8px;color:#f1f5f9;font-size:14px">${fillHtml(t.payText, { amount: `<strong>${esc(inr(d.amountDue))}</strong>` })}</p>
         <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:8px;background:#f97316"><a href="${esc(d.paymentUrl)}" style="display:inline-block;padding:12px 22px;color:#0a0a0f;font-weight:700;font-size:14px;text-decoration:none">${esc(fill(t.payButton, { amount: inr(d.amountDue) }))}</a></td></tr></table>
         <p style="margin:12px 0 0;color:#fde68a;font-size:13px">${fillHtml(t.receiptLine, { link: `<a href="${receiptUrl}" style="color:#f97316">${esc(receiptUrl.replace(/^https?:\/\//, ''))}</a>` })}</p>`
      : ''

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#13131d;border:1px solid #2a2a42;border-radius:12px">
<tr><td style="padding:24px 24px 8px"><img src="${site}/images/aurix-logo.png" width="96" alt="AURIX" style="display:block;border:0;height:auto"></td></tr>
<tr><td style="padding:8px 24px 0">
  <p style="margin:0;color:#f97316;font-size:12px;letter-spacing:1px;text-transform:uppercase">${esc(t.regKicker)}</p>
  <h1 style="margin:6px 0 12px;color:#ffffff;font-size:22px;line-height:1.3">${esc(d.event.title)}</h1>
  <p style="margin:0 0 16px;color:#cbd5e1;font-size:14px;line-height:1.6">${fillHtml(t.regIntro, { name: esc(d.leaderName), team: `<strong style="color:#fff">${esc(d.teamName)}</strong>` })}</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px"><tr><td style="background:#0a0a0f;border:1px solid #2a2a42;border-radius:8px;padding:12px 18px;font-family:'Courier New',monospace;font-size:20px;font-weight:700;color:#f97316;letter-spacing:1px">${esc(d.registrationCode)}</td></tr></table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${row(t.rowEvent, `<a href="${esc(eventUrl)}" style="color:#f1f5f9">${esc(d.event.title)}</a>`)}
    ${row(t.rowDate, esc(dates))}
    ${row(t.rowVenue, esc(d.event.venue || ''))}
    ${row(t.rowTeam, esc(d.teamName))}
    ${row(t.rowLeader, `${esc(d.leaderName)}<br><span style="color:#8b8ba7">${esc(d.leaderEmail)} · ${esc(d.leaderPhone)}</span>`)}
    ${row(t.rowCollege, esc(d.college))}
    ${row(t.rowFee, esc(inr(d.amountDue)))}
  </table>
  <p style="margin:16px 0 6px;color:#8b8ba7;font-size:13px">${esc(t.membersTitle)}</p>
  <ol style="margin:0;padding-left:20px;color:#f1f5f9;font-size:14px;line-height:1.5">${members}</ol>
  ${pay}
  <p style="margin:24px 0 6px;color:#f1f5f9;font-size:14px;font-weight:700">${esc(t.nextTitle)}</p>
  <ul style="margin:0;padding-left:20px;color:#cbd5e1;font-size:14px;line-height:1.6">
    <li>${esc(t.next1)}</li>
    <li>${esc(t.next2)}</li>
    <li>${fillHtml(t.next3, { link: `<a href="${statusUrl}" style="color:#f97316">${esc(statusHost)}</a>` })}</li>
  </ul>
</td></tr>
<tr><td style="padding:24px;border-top:1px solid #2a2a42;margin-top:24px">
  <p style="margin:0;color:#8b8ba7;font-size:12px;line-height:1.6">${esc(t.footerOrg)}<br>${fillHtml(t.regFooter, { site: esc(siteHost) })}</p>
</td></tr>
</table></td></tr></table></body></html>`

  const text = [
    `${t.regKicker}: ${d.event.title}`,
    '',
    fill(t.regIntro, { name: d.leaderName, team: `"${d.teamName}"` }),
    '',
    `${t.regCodeLabel}: ${d.registrationCode}`,
    `${t.rowEvent}: ${d.event.title}${dates ? ` (${dates})` : ''}`,
    d.event.venue ? `${t.rowVenue}: ${d.event.venue}` : '',
    `${t.rowLeader}: ${d.leaderName} · ${d.leaderEmail} · ${d.leaderPhone}`,
    `${t.rowCollege}: ${d.college}`,
    d.amountDue ? `${t.rowFee}: ${inr(d.amountDue)}` : '',
    '',
    `${t.membersTitle}:`,
    ...d.members.map((m, i) => `  ${i + 1}. ${m.name}${i === 0 ? t.leaderSuffix : ''} · ${m.college}`),
    '',
    d.paymentUrl && d.amountDue ? `${t.payTextShort}: ${d.paymentUrl}\n${fill(t.receiptLine, { link: receiptUrl })}\n` : '',
    `${t.nextTitle}: ${t.next1} ${t.next2}`,
    fill(t.next3, { link: statusUrl }),
    '',
    t.footerOrg,
  ]
    .filter((l, i, a) => l !== '' || a[i - 1] !== '')
    .join('\n')

  return { subject, html, text }
}

/** Shared shell for the short account emails (same look as the confirmation email). */
function accountShell(o: { kicker: string; title: string; intro: string; button: string; url: string; note: string; footer: string; copyLink: string; footerOrg: string }) {
  const site = SITE()
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(o.title)}</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#13131d;border:1px solid #2a2a42;border-radius:12px">
<tr><td style="padding:24px 24px 8px"><img src="${site}/images/aurix-logo.png" width="96" alt="AURIX" style="display:block;border:0;height:auto"></td></tr>
<tr><td style="padding:8px 24px 0">
  <p style="margin:0;color:#f97316;font-size:12px;letter-spacing:1px;text-transform:uppercase">${esc(o.kicker)}</p>
  <h1 style="margin:6px 0 12px;color:#ffffff;font-size:22px;line-height:1.3">${esc(o.title)}</h1>
  <p style="margin:0 0 20px;color:#cbd5e1;font-size:14px;line-height:1.6">${o.intro}</p>
  <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:8px;background:#f97316"><a href="${esc(o.url)}" style="display:inline-block;padding:12px 22px;color:#0a0a0f;font-weight:700;font-size:14px;text-decoration:none">${esc(o.button)}</a></td></tr></table>
  <p style="margin:20px 0 0;color:#8b8ba7;font-size:12px;line-height:1.6">${esc(o.copyLink)}<br><span style="color:#cbd5e1;word-break:break-all">${esc(o.url)}</span></p>
  <p style="margin:16px 0 0;color:#cbd5e1;font-size:13px;line-height:1.6">${o.note}</p>
</td></tr>
<tr><td style="padding:24px;border-top:1px solid #2a2a42">
  <p style="margin:0;color:#8b8ba7;font-size:12px;line-height:1.6">${esc(o.footerOrg)}<br>${esc(o.footer)}</p>
</td></tr>
</table></td></tr></table></body></html>`
}

/** Sign-up: confirm the email address. Unconfirmed accounts are deleted after `deleteAfterDays`. */
export function accountVerification(d: { name: string; url: string; expiresHours: number; deleteOn: string }, t: EmailTexts = DEFAULT_EMAIL_TEXTS) {
  const subject = t.verifySubject
  const html = accountShell({
    kicker: t.verifyKicker,
    title: t.verifyTitle,
    intro: fillHtml(t.verifyIntro, { name: esc(d.name) }),
    button: t.verifyButton,
    url: d.url,
    note: fillHtml(t.verifyNote, { hours: String(d.expiresHours), date: `<strong style="color:#fff">${esc(d.deleteOn)}</strong>` }),
    footer: t.verifyFooter,
    copyLink: t.copyLink,
    footerOrg: t.footerOrg,
  })
  const text = [
    subject,
    '',
    fill(t.verifyIntro, { name: d.name }),
    '',
    `${t.verifyButton}: ${d.url}`,
    '',
    fill(t.verifyNote, { hours: d.expiresHours, date: d.deleteOn }),
    '',
    t.verifyFooter,
  ].join('\n')
  return { subject, html, text }
}

/** Forgot password: link to choose a new one. */
export function passwordReset(d: { name: string; url: string; expiresMinutes: number }, t: EmailTexts = DEFAULT_EMAIL_TEXTS) {
  const subject = t.resetSubject
  const html = accountShell({
    kicker: t.resetKicker,
    title: t.resetTitle,
    intro: fillHtml(t.resetIntro, { name: esc(d.name) }),
    button: t.resetButton,
    url: d.url,
    note: fillHtml(t.resetNote, { minutes: String(d.expiresMinutes) }),
    footer: t.resetFooter,
    copyLink: t.copyLink,
    footerOrg: t.footerOrg,
  })
  const text = [
    subject,
    '',
    fill(t.resetIntro, { name: d.name }),
    '',
    `${t.resetButton}: ${d.url}`,
    '',
    fill(t.resetNote, { minutes: d.expiresMinutes }),
    '',
    t.resetFooter,
  ].join('\n')
  return { subject, html, text }
}

export type IdReuploadData = { name: string; team: string; code: string; event: string; reason?: string | null; deadline: string }

/** Student ID rejected: upload a valid card by the deadline at /aurix/update-id, or the registration is cancelled. */
export function idReuploadRequest(d: IdReuploadData, t: EmailTexts = DEFAULT_EMAIL_TEXTS) {
  const site = SITE()
  const url = `${site}/aurix/update-id`
  const subject = fill(t.idReqSubject, { team: d.team, code: d.code })
  const reason = (d.reason || '').trim()
  const deadlineHtml = `<strong style="color:#fff">${esc(d.deadline)}</strong>`
  const html = accountShell({
    kicker: t.idReqKicker,
    title: t.idReqTitle,
    intro: fillHtml(t.idReqIntro, { name: esc(d.name), team: `<strong style="color:#fff">${esc(d.team)}</strong>`, event: esc(d.event) }),
    button: t.idReqButton,
    url,
    note:
      (reason ? `${fillHtml(t.idReqReason, { reason: esc(reason) })}<br><br>` : '') +
      fillHtml(t.idReqDeadline, { deadline: deadlineHtml }),
    footer: fill(t.idReqFooter, { site: site.replace(/^https?:\/\//, '') }),
    copyLink: t.copyLink,
    footerOrg: t.footerOrg,
  })
  const text = [
    subject,
    '',
    fill(t.idReqIntro, { name: d.name, team: d.team, event: d.event }),
    ...(reason ? ['', fill(t.idReqReason, { reason })] : []),
    '',
    fill(t.idReqDeadline, { deadline: d.deadline }),
    '',
    `${t.idReqHow}: ${url}`,
    '',
    fill(t.idReqFooter, { site: site.replace(/^https?:\/\//, '') }),
  ].join('\n')
  return { subject, html, text }
}

/** Cancelled automatically: no valid student ID card by the deadline. */
export function registrationCancelledNoId(d: Omit<IdReuploadData, 'reason'>, t: EmailTexts = DEFAULT_EMAIL_TEXTS) {
  const site = SITE()
  const url = `${site}/aurix/status`
  const subject = fill(t.cancelSubject, { team: d.team, code: d.code })
  const html = accountShell({
    kicker: t.cancelKicker,
    title: t.cancelTitle,
    intro: fillHtml(t.cancelIntro, {
      name: esc(d.name),
      team: `<strong style="color:#fff">${esc(d.team)}</strong>`,
      event: esc(d.event),
      deadline: esc(d.deadline),
    }),
    button: t.cancelButton,
    url,
    note: esc(t.cancelNote),
    footer: fill(t.cancelFooter, { site: site.replace(/^https?:\/\//, '') }),
    copyLink: t.copyLink,
    footerOrg: t.footerOrg,
  })
  const text = [
    subject,
    '',
    fill(t.cancelIntro, { name: d.name, team: d.team, event: d.event, deadline: d.deadline }),
    '',
    t.cancelNote,
    '',
    `${t.cancelButton}: ${url}`,
    '',
    fill(t.cancelFooter, { site: site.replace(/^https?:\/\//, '') }),
  ].join('\n')
  return { subject, html, text }
}
