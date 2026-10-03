import React from 'react'
import { MailWarning } from 'lucide-react'
import { getFormTexts } from '@/lib/form-texts'
import { fill } from '@/lib/form-texts-defaults'
import { confirmationQueued, deletionDateText } from '@/lib/auth/participant'
import { getPayload } from 'payload'
import config from '@payload-config'
import { LogoutButton, ResendVerification } from './AccountButtons'

/** Shown instead of the portal / registration form until a participant confirms their email. */
export async function VerifyGate({ user }: { user: { id: number | string; email: string; createdAt?: string } }) {
  const t = (await getFormTexts()).account
  const queued = await confirmationQueued(await getPayload({ config }), user.id).catch(() => false)
  const vars = { email: user.email, date: deletionDateText(user.createdAt || new Date()) }
  return (
    <div className="max-w-xl mx-auto aurix-card rounded-2xl p-6 sm:p-8 space-y-5 border-aurix-orange/40">
      <div className="flex items-start gap-3">
        <MailWarning className="w-6 h-6 text-aurix-orange shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h2 className="text-xl font-display font-bold text-white">{t.gateTitle}</h2>
          <p className="text-slate-300 text-sm leading-relaxed">{fill(t.gateText, vars)}</p>
          {queued && <p className="text-yellow-400 text-xs">{t.mailLimit}</p>}
          <p className="text-slate-400 text-xs">{t.checkSpam}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-aurix-border/60">
        <ResendVerification label={t.resend} done={t.resent} queuedText={t.mailLimit} />
        <LogoutButton label={t.logout} />
      </div>
    </div>
  )
}
