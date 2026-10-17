/**
 * Competition pages (owner, 17 Oct 2026): the "Contact Us" pop-up (each competition's own contacts, WhatsApp chat on
 * +91 numbers) and the "deadline extended" heading. Pure helpers, unit-tested (tests/aurix-promo.test.ts).
 */

export type EventContact = { name: string; role?: string; phone: string }

/** An Indian mobile number as its 10 digits ("+91 98765-43210", "098765 43210" → "9876543210"); null = not one. */
export function indianMobile(v: unknown): string | null {
  let d = String(v ?? '').replace(/[\s\-().]/g, '')
  if (d.startsWith('+91')) d = d.slice(3)
  else if (d.length === 12 && d.startsWith('91')) d = d.slice(2)
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1)
  return /^[6-9]\d{9}$/.test(d) ? d : null
}

/** "+91 98765 43210" for display. */
export const displayMobile = (digits: string) => `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`

/** The WhatsApp chat link (opens the app on phones, WhatsApp Web elsewhere), with an optional first message. */
export function whatsappLink(digits: string, message?: string): string {
  const text = String(message || '').trim()
  return `https://wa.me/91${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

/** The contacts that can be shown: a name and a valid number (bad rows are skipped, never shown half-broken). */
export function usableContacts(rows: unknown): EventContact[] {
  if (!Array.isArray(rows)) return []
  return rows.flatMap((r: any) => {
    const phone = indianMobile(r?.phone)
    const name = String(r?.name || '').trim()
    return phone && name ? [{ name, role: String(r?.role || '').trim() || undefined, phone }] : []
  })
}

/** Show the "deadline extended" heading: switched on, registration open, and the (enforced) deadline still ahead. */
export function showsExtension(e: { deadlineExtended?: boolean; status: string; registrationClose?: string | null }, now = new Date()): boolean {
  if (!e.deadlineExtended || e.status !== 'REGISTRATION_OPEN' || !e.registrationClose) return false
  const t = new Date(e.registrationClose).getTime()
  return Number.isFinite(t) && t > now.getTime()
}

/** "23 Oct, 11:59 PM" in India time (the wording adds "IST"). */
export const istShort = (iso: string) =>
  new Date(iso)
    .toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })
    .replace(/\b(am|pm)\b/, (m) => m.toUpperCase())
