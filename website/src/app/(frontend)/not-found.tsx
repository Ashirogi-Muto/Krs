import Link from 'next/link'
import { ArrowLeft, Compass, Bot } from 'lucide-react'
import { getFormTexts } from '@/lib/form-texts'

/** 404 page; wording from the CMS (Forms & messages → 404 page). */
export default async function NotFound() {
  const t = (await getFormTexts()).notFound
  return (
    <div className="min-h-screen bg-krs-dark flex flex-col items-center justify-center p-6 text-center bg-tech-grid">
      <div className="w-16 h-16 rounded-2xl bg-krs-surface border border-krs-border flex items-center justify-center text-krs-cyan mb-6 shadow-lg shadow-krs-cyan/10">
        <Bot className="w-8 h-8" />
      </div>

      <span className="text-xs font-mono tracking-widest text-krs-cyan uppercase mb-2">
        {t.eyebrow}
      </span>

      <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
        {t.title}
      </h1>

      <p className="max-w-md text-slate-400 text-sm md:text-base mb-8 leading-relaxed">
        {t.text}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-krs-cyan text-black font-semibold text-sm hover:bg-cyan-400 transition-colors shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.homeButton}
        </Link>
        <Link
          href="/aurix"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-aurix-surface border border-aurix-border text-aurix-orange font-semibold text-sm hover:border-aurix-orange transition-colors"
        >
          <Compass className="w-4 h-4" />
          {t.aurixButton}
        </Link>
      </div>
    </div>
  )
}
