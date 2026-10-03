/**
 * Email templates. Table-based HTML with inline styles (works in Gmail, Outlook and phone mail apps),
 * plus a plain-text version. Only data that the registration actually has is used.
 */
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

export function registrationConfirmation(d: ConfirmationData) {
  const site = SITE()
  const statusUrl = `${site}/aurix/status`
  const eventUrl = `${site}/aurix/${d.event.slug}`
  const dates = d.event.startDate
    ? dateIST(d.event.endDate) && dateIST(d.event.endDate) !== dateIST(d.event.startDate)
      ? `${dateIST(d.event.startDate)} – ${dateIST(d.event.endDate)}`
      : dateIST(d.event.startDate)
    : ''
  const subject = `Registration received: ${d.event.title} — ${d.registrationCode}`

  const row = (label: string, value: string) =>
    value
      ? `<tr><td style="padding:6px 0;color:#8b8ba7;font-size:13px;width:150px;vertical-align:top">${esc(label)}</td><td style="padding:6px 0;color:#f1f5f9;font-size:14px">${value}</td></tr>`
      : ''
  const members = d.members
    .map((m, i) => `<li style="margin:0 0 4px">${esc(m.name)}${i === 0 ? ' (leader)' : ''} <span style="color:#8b8ba7">· ${esc(m.college)}</span></li>`)
    .join('')
  const pay =
    d.paymentUrl && d.amountDue
      ? `<p style="margin:24px 0 8px;color:#f1f5f9;font-size:14px">Your registration fee is <strong>${inr(d.amountDue)}</strong>. If you have not paid yet, use this link (your details are pre-filled):</p>
         <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:8px;background:#f97316"><a href="${esc(d.paymentUrl)}" style="display:inline-block;padding:12px 22px;color:#0a0a0f;font-weight:700;font-size:14px;text-decoration:none">Pay ${inr(d.amountDue)}</a></td></tr></table>`
      : ''

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#13131d;border:1px solid #2a2a42;border-radius:12px">
<tr><td style="padding:24px 24px 8px"><img src="${site}/images/aurix-logo.png" width="96" alt="AURIX" style="display:block;border:0;height:auto"></td></tr>
<tr><td style="padding:8px 24px 0">
  <p style="margin:0;color:#f97316;font-size:12px;letter-spacing:1px;text-transform:uppercase">Registration received</p>
  <h1 style="margin:6px 0 12px;color:#ffffff;font-size:22px;line-height:1.3">${esc(d.event.title)}</h1>
  <p style="margin:0 0 16px;color:#cbd5e1;font-size:14px;line-height:1.6">Hi ${esc(d.leaderName)}, thank you for registering team <strong style="color:#fff">${esc(d.teamName)}</strong>. Keep your registration code — you will need it to check your status and at the event.</p>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px"><tr><td style="background:#0a0a0f;border:1px solid #2a2a42;border-radius:8px;padding:12px 18px;font-family:'Courier New',monospace;font-size:20px;font-weight:700;color:#f97316;letter-spacing:1px">${esc(d.registrationCode)}</td></tr></table>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${row('Event', `<a href="${esc(eventUrl)}" style="color:#f1f5f9">${esc(d.event.title)}</a>`)}
    ${row('Date', esc(dates))}
    ${row('Venue', esc(d.event.venue || ''))}
    ${row('Team', esc(d.teamName))}
    ${row('Leader', `${esc(d.leaderName)}<br><span style="color:#8b8ba7">${esc(d.leaderEmail)} · ${esc(d.leaderPhone)}</span>`)}
    ${row('College', esc(d.college))}
    ${row('Fee', inr(d.amountDue))}
  </table>
  <p style="margin:16px 0 6px;color:#8b8ba7;font-size:13px">Team members</p>
  <ol style="margin:0;padding-left:20px;color:#f1f5f9;font-size:14px;line-height:1.5">${members}</ol>
  ${pay}
  <p style="margin:24px 0 6px;color:#f1f5f9;font-size:14px;font-weight:700">What happens next</p>
  <ul style="margin:0;padding-left:20px;color:#cbd5e1;font-size:14px;line-height:1.6">
    <li>Our team checks the student ID cards and your payment.</li>
    <li>Once both are verified, your registration is confirmed.</li>
    <li>Check your status any time at <a href="${statusUrl}" style="color:#f97316">${statusUrl.replace(/^https?:\/\//, '')}</a> with your code and this email address.</li>
  </ul>
</td></tr>
<tr><td style="padding:24px;border-top:1px solid #2a2a42;margin-top:24px">
  <p style="margin:0;color:#8b8ba7;font-size:12px;line-height:1.6">AURIX 2026 · Kalam Robotics Society, IILM University, Greater Noida<br>You received this email because this address was used to register a team at ${site.replace(/^https?:\/\//, '')}.</p>
</td></tr>
</table></td></tr></table></body></html>`

  const text = [
    `Registration received: ${d.event.title}`,
    '',
    `Hi ${d.leaderName}, thank you for registering team "${d.teamName}".`,
    '',
    `Registration code: ${d.registrationCode}`,
    `Event: ${d.event.title}${dates ? ` (${dates})` : ''}`,
    d.event.venue ? `Venue: ${d.event.venue}` : '',
    `Leader: ${d.leaderName} · ${d.leaderEmail} · ${d.leaderPhone}`,
    `College: ${d.college}`,
    d.amountDue ? `Fee: ${inr(d.amountDue)}` : '',
    '',
    'Team members:',
    ...d.members.map((m, i) => `  ${i + 1}. ${m.name}${i === 0 ? ' (leader)' : ''} · ${m.college}`),
    '',
    d.paymentUrl && d.amountDue ? `If you have not paid yet: ${d.paymentUrl}\n` : '',
    'What happens next: our team checks the student ID cards and your payment; once both are verified your registration is confirmed.',
    `Check your status: ${statusUrl} (registration code + this email address)`,
    '',
    'AURIX 2026 · Kalam Robotics Society, IILM University, Greater Noida',
  ]
    .filter((l, i, a) => l !== '' || a[i - 1] !== '')
    .join('\n')

  return { subject, html, text }
}

/** Shared shell for the short account emails (same look as the confirmation email). */
function accountShell(o: { kicker: string; title: string; intro: string; button: string; url: string; note: string; footer: string }) {
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
  <p style="margin:20px 0 0;color:#8b8ba7;font-size:12px;line-height:1.6">If the button does not work, copy this link into your browser:<br><span style="color:#cbd5e1;word-break:break-all">${esc(o.url)}</span></p>
  <p style="margin:16px 0 0;color:#cbd5e1;font-size:13px;line-height:1.6">${o.note}</p>
</td></tr>
<tr><td style="padding:24px;border-top:1px solid #2a2a42">
  <p style="margin:0;color:#8b8ba7;font-size:12px;line-height:1.6">AURIX 2026 · Kalam Robotics Society, IILM University, Greater Noida<br>${o.footer}</p>
</td></tr>
</table></td></tr></table></body></html>`
}

/** Sign-up: confirm the email address. Unconfirmed accounts are deleted after `deleteAfterDays`. */
export function accountVerification(d: { name: string; url: string; expiresHours: number; deleteOn: string }) {
  const subject = 'Confirm your email for your AURIX account'
  const html = accountShell({
    kicker: 'Confirm your email',
    title: 'One step left',
    intro: `Hi ${esc(d.name)}, please confirm this email address to activate your AURIX account. You need a confirmed account to register a team.`,
    button: 'Confirm my email',
    url: d.url,
    note: `This link works for ${d.expiresHours} hours. <strong style="color:#fff">Accounts that are not confirmed are deleted on ${esc(d.deleteOn)}</strong> (7 days after sign-up); you can sign up again any time.`,
    footer: 'You received this email because this address was used to create an account. If that was not you, ignore it and the account will be deleted.',
  })
  const text = [
    'Confirm your email for your AURIX account',
    '',
    `Hi ${d.name}, please confirm this email address to activate your AURIX account. You need a confirmed account to register a team.`,
    '',
    `Confirm: ${d.url}`,
    '',
    `This link works for ${d.expiresHours} hours. Accounts that are not confirmed are deleted on ${d.deleteOn} (7 days after sign-up).`,
    '',
    'If you did not create this account, ignore this email.',
  ].join('\n')
  return { subject, html, text }
}

/** Forgot password: link to choose a new one. */
export function passwordReset(d: { name: string; url: string; expiresMinutes: number }) {
  const subject = 'Reset your AURIX account password'
  const html = accountShell({
    kicker: 'Password reset',
    title: 'Choose a new password',
    intro: `Hi ${esc(d.name)}, we received a request to reset the password of your account.`,
    button: 'Choose a new password',
    url: d.url,
    note: `This link works for ${d.expiresMinutes} minutes and only once. If you did not ask for this, ignore this email; your password stays the same.`,
    footer: 'You received this email because a password reset was requested for this address.',
  })
  const text = [
    'Reset your AURIX account password',
    '',
    `Hi ${d.name}, we received a request to reset the password of your account.`,
    '',
    `Choose a new password: ${d.url}`,
    '',
    `This link works for ${d.expiresMinutes} minutes and only once. If you did not ask for this, ignore this email.`,
  ].join('\n')
  return { subject, html, text }
}
