import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/** Old address: payment matching moved into the CMS (Registrations → Payment matching, 9 Oct 2026). */
export default function PaymentMatchingPage() {
  redirect('/admin/payment-matching')
}
