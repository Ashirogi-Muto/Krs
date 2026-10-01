import React from 'react'
import Link from 'next/link'
import { Flame, ArrowUpRight } from 'lucide-react'
import { isRouteVisible } from '@/lib/visibility'

export function AURIXFooter() {
  return (
    <footer className="border-t border-aurix-border bg-aurix-dark text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Identity */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-aurix-surface border border-aurix-border flex items-center justify-center text-aurix-orange">
                <Flame className="w-4 h-4" />
              </div>
              <span className="font-display font-extrabold text-white tracking-wider text-sm uppercase">
                AURIX 2026
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              National robotics tournament & hackathon arena powered by Kalam Robotics Society at IILM University, Greater Noida.
            </p>
            <div className="text-[11px] font-mono text-slate-400">
              Venue: IILM University
              <br />
              Greater Noida, UP, India
            </div>
          </div>

          {/* Competitions */}
          <div>
            <h3 className="font-mono text-xs text-white uppercase tracking-wider mb-3">
              Competitions
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/aurix/hackathon" className="hover:text-aurix-orange transition-colors">
                  Robotics & AI Hackathon (Coming Soon)
                </Link>
              </li>
              <li>
                <Link href="/aurix/robo-soccer" className="hover:text-aurix-orange transition-colors">
                  AURIX Robo Soccer (₹699)
                </Link>
              </li>
              <li>
                <Link href="/aurix/robo-race" className="hover:text-aurix-orange transition-colors">
                  AURIX Robo Race (₹699)
                </Link>
              </li>
              <li>
                <Link href="/aurix/robo-expo" className="hover:text-aurix-orange transition-colors">
                  AURIX Robo Expo (₹500)
                </Link>
              </li>
              <li>
                <Link href="/aurix/robo-ideathon" className="hover:text-aurix-orange transition-colors">
                  AURIX Robo Ideathon (₹499)
                </Link>
              </li>
            </ul>
          </div>

          {/* Operations & Rulebooks */}
          <div>
            <h3 className="font-mono text-xs text-white uppercase tracking-wider mb-3">
              Tournament Operations
            </h3>
            <ul className="space-y-2">
              {isRouteVisible('/aurix/portal') && (
                <li>
                  <Link href="/aurix/portal" className="hover:text-aurix-orange transition-colors">
                    Participant Dashboard
                  </Link>
                </li>
              )}
              {isRouteVisible('/aurix/schedule') && (
                <li>
                  <Link href="/aurix/schedule" className="hover:text-aurix-orange transition-colors">
                    Master Timeline
                  </Link>
                </li>
              )}
              <li>
                <Link href="/aurix/rules" className="hover:text-aurix-orange transition-colors">
                  Official Technical Rulebooks
                </Link>
              </li>
              {isRouteVisible('/aurix/results') && (
                <li>
                  <Link href="/aurix/results" className="hover:text-aurix-orange transition-colors">
                    Published Results
                  </Link>
                </li>
              )}
              <li>
                <Link href="/aurix/faq" className="hover:text-aurix-orange transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Back to KRS */}
          <div>
            <h3 className="font-mono text-xs text-krs-cyan uppercase tracking-wider mb-3">
              KRS Society
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                  KRS Public Society <ArrowUpRight className="w-3 h-3 text-krs-cyan" />
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-white transition-colors">
                  Rover & Hardware Portfolio
                </Link>
              </li>
              <li>
                <Link href="/learning" className="hover:text-white transition-colors">
                  Robotics Knowledge Hub
                </Link>
              </li>
              {isRouteVisible('/team') && (
                <li>
                  <Link href="/team" className="hover:text-white transition-colors">
                    Society Leadership
                  </Link>
                </li>
              )}
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-aurix-border/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-400">
          <div>
            AURIX 2026 // Kalam Robotics Society // IILM University Greater Noida
          </div>
          <div>
            <Link href="/terms" className="hover:text-aurix-orange">
              Tournament Terms & Code of Conduct
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
