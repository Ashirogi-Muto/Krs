'use client'

import React, { useState } from 'react'
import { AlertCircle, CheckCircle2, KeyRound, Loader2, User, Shield, Lock } from 'lucide-react'
import type { PortalTexts } from '@/lib/portal-texts-defaults'

interface UserProfile {
  name: string
  email: string
  role: string
  phone?: string
  institution?: string
}

const inputClass =
  'w-full px-3 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-aurix-orange font-mono'
const disabledInputClass =
  'w-full px-3 py-2.5 rounded-lg bg-aurix-dark/40 border border-aurix-border/40 text-sm text-slate-500 font-mono cursor-not-allowed'

/** Wording: CMS → Website → Participant portal → Profile & security (passed in by the server page). */
export function ProfileForm({ initialUser, t, forgotHref }: { initialUser: UserProfile; t: PortalTexts['profile']; forgotHref?: string }) {
  // Profile state
  const [name, setName] = useState(initialUser.name || '')
  const [phone, setPhone] = useState(initialUser.phone || '')
  const [institution, setInstitution] = useState(initialUser.institution || '')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(null)
    setProfileLoading(true)

    try {
      const res = await fetch('/api/aurix/portal/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          name: name.trim(),
          phone: phone.trim(),
          institution: institution.trim(),
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.message || t.errProfile)
      }

      setProfileSuccess(t.saved)
    } catch (err: any) {
      setProfileError(err.message)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (newPassword !== confirmPassword) {
      setPasswordError(t.mismatch)
      return
    }

    if (newPassword.length < 8) {
      setPasswordError(t.tooShort)
      return
    }

    setPasswordLoading(true)

    try {
      const res = await fetch('/api/aurix/portal/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          currentPassword,
          newPassword,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) {
        throw new Error(data.message || t.errPassword)
      }

      setPasswordSuccess(t.changed)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordError(err.message)
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile Details Form */}
      <form onSubmit={handleUpdateProfile} className="aurix-card rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1 border-b border-aurix-border/60 pb-4">
          <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-aurix-orange" /> {t.detailsTitle}
          </h2>
          <p className="text-xs text-slate-400">
            {t.detailsIntro}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-mono uppercase text-slate-400">{t.name}</span>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-mono uppercase text-slate-400">{t.email}</span>
            <input className={disabledInputClass} value={initialUser.email} disabled />
            <span className="text-[10px] font-mono text-slate-500 block">
              {t.emailNote}
            </span>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-mono uppercase text-slate-400">{t.role}</span>
            <input className={disabledInputClass} value={initialUser.role} disabled />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-mono uppercase text-slate-400">{t.phone}</span>
            <input
              className={inputClass}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>

          <label className="block space-y-1.5 sm:col-span-2">
            <span className="text-xs font-mono uppercase text-slate-400">{t.college}</span>
            <input
              className={inputClass}
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              required
            />
          </label>
        </div>

        {profileError && (
          <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs sm:text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{profileError}</span>
          </div>
        )}

        {profileSuccess && (
          <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs sm:text-sm flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{profileSuccess}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={profileLoading}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-aurix-orange text-black font-semibold text-xs font-mono uppercase tracking-wider hover:bg-orange-400 transition-colors disabled:opacity-60"
        >
          {profileLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {t.save}
        </button>
      </form>

      {/* Password Change Form */}
      <form onSubmit={handleChangePassword} className="aurix-card rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1 border-b border-aurix-border/60 pb-4">
          <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-aurix-orange" /> {t.securityTitle}
          </h2>
          <p className="text-xs text-slate-400">
            {t.securityIntro}
          </p>
        </div>

        <div className="space-y-4 max-w-md">
          <label className="block space-y-1.5">
            <span className="text-xs font-mono uppercase text-slate-400">{t.current}</span>
            <input
              className={inputClass}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-mono uppercase text-slate-400">{t.newPassword}</span>
            <input
              className={inputClass}
              type="password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-mono uppercase text-slate-400">{t.confirmPassword}</span>
            <input
              className={inputClass}
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>
        </div>

        {passwordError && (
          <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-xs sm:text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs sm:text-sm flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={passwordLoading}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-aurix-dark border border-aurix-border text-slate-200 font-mono text-xs uppercase hover:text-white hover:border-aurix-orange transition-colors disabled:opacity-60"
        >
          {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
          {t.update}
        </button>

        <div className="p-4 rounded-xl bg-aurix-dark/40 border border-aurix-border/40 text-xs text-slate-400 space-y-1">
          <span className="font-bold text-slate-300 block">{t.forgotTitle}</span>
          <p className="leading-relaxed">{t.forgotText}</p>
          {forgotHref && (
            <a href={forgotHref} className="inline-block text-aurix-orange hover:underline font-mono">
              {t.forgotLink}
            </a>
          )}
        </div>
      </form>
    </div>
  )
}
