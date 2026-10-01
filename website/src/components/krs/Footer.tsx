import React from 'react'
import Link from 'next/link'
import { Cpu, ArrowUpRight } from 'lucide-react'
import { isRouteVisible } from '@/lib/visibility'

export function KRSFooter() {
  return (
    <footer className="border-t border-krs-border bg-krs-dark text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Identity Column */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-krs-surface border border-krs-border flex items-center justify-center text-krs-cyan">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="font-display font-bold text-white tracking-tight text-sm">
                KALAM ROBOTICS SOCIETY
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Multidisciplinary engineering laboratory and student robotics society affiliated with IILM University, Greater Noida.
            </p>
            <div className="text-[11px] font-mono text-slate-500">
              IILM University, Greater Noida
              <br />
              Uttar Pradesh, India
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h3 className="font-mono text-xs text-white uppercase tracking-wider mb-3">
              Society
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/projects" className="hover:text-krs-cyan transition-colors">
                  Engineering Projects
                </Link>
              </li>
              <li>
                <Link href="/learning" className="hover:text-krs-cyan transition-colors">
                  Robotics Knowledge Hub
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-krs-cyan transition-colors">
                  Workshops & Events
                </Link>
              </li>
              <li>
                <Link href="/gallery" className="hover:text-krs-cyan transition-colors">
                  Lab & Field Gallery
                </Link>
              </li>
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
            © {new Date().getFullYear()} Kalam Robotics Society, IILM University Greater Noida. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>LEARN. BUILD. COMPETE. INNOVATE.</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
