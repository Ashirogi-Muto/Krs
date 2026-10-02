import React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { isVisibleIn } from '@/lib/visibility'
import { getHiddenRoutes, getSiteSettings } from '@/lib/site-settings'

export async function KRSFooter() {
  const hidden = await getHiddenRoutes()
  const site = await getSiteSettings()
  const isRouteVisible = (href: string) => isVisibleIn(hidden, href)

  return (
    <footer className="border-t border-krs-border bg-krs-dark text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Identity Column */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/krs-mark-light.png" alt="KRS logo" width={32} height={32} className="w-8 h-8" />
              <span className="font-display font-bold text-white tracking-tight text-sm">
                KALAM ROBOTICS SOCIETY
              </span>
            </div>
            {site.footerBlurb && <p className="text-slate-400 leading-relaxed text-xs">{site.footerBlurb}</p>}
            <div className="text-[11px] font-mono text-slate-500">
              {site.institution}
              {site.location && (
                <>
                  <br />
                  {site.location}
                </>
              )}
            </div>
            {site.contactEmail && (
              <a href={`mailto:${site.contactEmail}`} className="block text-[11px] font-mono text-slate-400 hover:text-krs-cyan">
                {site.contactEmail}
              </a>
            )}
            {site.socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-3 text-[11px] font-mono">
                {site.socialLinks.map((l) => (
                  <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-krs-cyan">
                    {l.platform}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="font-mono text-xs text-white uppercase tracking-wider mb-3">
              Society
            </h3>
            <ul className="space-y-2">
              {isRouteVisible('/projects') && (
                <li>
                  <Link href="/projects" className="hover:text-krs-cyan transition-colors">
                    Engineering Projects
                  </Link>
                </li>
              )}
              {isRouteVisible('/learning') && (
                <li>
                  <Link href="/learning" className="hover:text-krs-cyan transition-colors">
                    Robotics Knowledge Hub
                  </Link>
                </li>
              )}
              {isRouteVisible('/events') && (
                <li>
                  <Link href="/events" className="hover:text-krs-cyan transition-colors">
                    Workshops & Events
                  </Link>
                </li>
              )}
              {isRouteVisible('/gallery') && (
                <li>
                  <Link href="/gallery" className="hover:text-krs-cyan transition-colors">
                    Lab & Field Gallery
                  </Link>
                </li>
              )}
              {isRouteVisible('/insights') && (
                <li>
                  <Link href="/insights" className="hover:text-krs-cyan transition-colors">
                    Society Insights
                  </Link>
                </li>
              )}
              {isRouteVisible('/team') && (
                <li>
                  <Link href="/team" className="hover:text-krs-cyan transition-colors">
                    Society Leadership
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* AURIX Competitions */}
          <div>
            <h3 className="font-mono text-xs text-aurix-orange uppercase tracking-wider mb-3">
              AURIX Arena
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/aurix/hackathon" className="hover:text-white transition-colors flex items-center gap-1">
                  Robotics & AI Hackathon <ArrowUpRight className="w-3 h-3 text-aurix-orange" />
                </Link>
              </li>
              <li>
                <Link href="/aurix/robo-soccer" className="hover:text-white transition-colors">
                  AURIX Robo Soccer
                </Link>
              </li>
              <li>
                <Link href="/aurix/robo-race" className="hover:text-white transition-colors">
                  AURIX Robo Race
                </Link>
              </li>
              <li>
                <Link href="/aurix/robo-expo" className="hover:text-white transition-colors">
                  AURIX Robo Expo
                </Link>
              </li>
              <li>
                <Link href="/aurix/robo-ideathon" className="hover:text-white transition-colors">
                  AURIX Robo Ideathon
                </Link>
              </li>
              {isRouteVisible('/aurix/schedule') && (
                <li>
                  <Link href="/aurix/schedule" className="hover:text-white transition-colors">
                    Master Event Schedule
                  </Link>
                </li>
              )}
              <li>
                <Link href="/aurix/rules" className="hover:text-white transition-colors">
                  Official Rulebooks
                </Link>
              </li>
            </ul>
          </div>

          {/* Operational & Legal */}
          <div>
            <h3 className="font-mono text-xs text-white uppercase tracking-wider mb-3">
              Operations & Legal
            </h3>
            <ul className="space-y-2">
              {isRouteVisible('/join') && (
                <li>
                  <Link href="/join" className="hover:text-krs-cyan transition-colors">
                    Apply for Membership
                  </Link>
                </li>
              )}
              {isRouteVisible('/contact') && (
                <li>
                  <Link href="/contact" className="hover:text-krs-cyan transition-colors">
                    Official Contact
                  </Link>
                </li>
              )}
              <li>
                <Link href="/privacy" className="hover:text-krs-cyan transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-krs-cyan transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-krs-cyan transition-colors text-slate-500">
                  CMS Administration
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-krs-border/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-400">
          <div>
            © {new Date().getFullYear()} {site.name}, {site.institution}. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            {site.motto && <span>{site.motto}</span>}
          </div>
        </div>
      </div>
    </footer>
  )
}
