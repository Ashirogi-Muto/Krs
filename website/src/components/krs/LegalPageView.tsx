import React from 'react'
import type { LegalPage } from '@/lib/data/seed-legal'
import { getFormTexts } from '@/lib/form-texts'

/** Renders a CMS legal page: blank line = paragraph, lines starting with "- " = bullet list. Plain text only. */
function Body({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean)
        if (lines.every((l) => l.startsWith('- '))) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1">
              {lines.map((l, j) => (
                <li key={j}>{l.slice(2)}</li>
              ))}
            </ul>
          )
        }
        return <p key={i}>{lines.join(' ')}</p>
      })}
    </>
  )
}

export async function LegalPageView({ page }: { page: LegalPage }) {
  const eyebrow = (await getFormTexts()).general.legalEyebrow
  return (
    <>
      <header className="space-y-2 border-b border-krs-border pb-6">
        <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">{eyebrow}</span>
        <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-white tracking-tight">{page.title}</h1>
        {page.lastUpdated && <p className="text-slate-400 text-xs font-mono">Last Updated: {page.lastUpdated}</p>}
      </header>
      <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
        {page.sections.map((s) => (
          <section key={s.heading} className="space-y-2">
            <h2 className="text-lg font-display font-bold text-white">{s.heading}</h2>
            <Body text={s.body} />
          </section>
        ))}
      </div>
    </>
  )
}
