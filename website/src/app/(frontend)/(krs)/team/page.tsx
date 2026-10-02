import React from 'react'
import { constructMetadata } from '@/lib/seo/metadata'
import { BreadcrumbsJsonLd } from '@/lib/seo/structured-data'
import { getTeamMembers } from '@/lib/data/content'
import { Users, GraduationCap, Shield, Terminal } from 'lucide-react'

// Content comes from the CMS; re-read at most once a minute
export const revalidate = 60

export const metadata = constructMetadata({
  title: 'Society Leadership & Faculty | Kalam Robotics Society',
  description:
    'Meet the faculty coordinators, executive leadership, and technical domain leads steering robotics research and competitions at IILM University Greater Noida.',
  path: '/team',
})

const GROUP_TITLES: Record<string, string> = {
  FACULTY: 'Faculty Advisory & Oversight',
  LEADERSHIP: 'Executive Core Leadership',
  ROBOTICS: 'Robotics & Mechatronics Team',
  SOFTWARE_AI: 'Software, AI & Perception Team',
  ELECTRONICS: 'Electronics & Embedded Systems Team',
  MECHANICAL: 'Mechanical & Structural Engineering Team',
  MEDIA: 'Media & Operations Team',
}

export default async function TeamPage() {
  const members = await getTeamMembers()

  const groups = ['FACULTY', 'LEADERSHIP', 'ELECTRONICS', 'SOFTWARE_AI'] as const

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <BreadcrumbsJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Team', url: '/team' },
        ]}
      />

      <div className="max-w-3xl space-y-4">
        <span className="text-xs font-mono text-krs-cyan uppercase tracking-wider">
          Governance & Technical Leads // Society Directory
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
          Leadership & Technical Core
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          The students and faculty coordinators directing operations, engineering laboratories, and competition platforms for Kalam Robotics Society at IILM University.
        </p>
      </div>

      {/* Member Groups */}
      <div className="space-y-16">
        {groups.map((grpKey) => {
          const groupMembers = members.filter((m) => m.teamGroup === grpKey)
          if (groupMembers.length === 0) return null

          return (
            <section key={grpKey} className="space-y-6">
              <div className="border-b border-krs-border pb-3 flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                  {GROUP_TITLES[grpKey] || grpKey}
                </h2>
                <span className="text-xs font-mono text-slate-500">
                  {groupMembers.length} {groupMembers.length === 1 ? 'Member' : 'Members'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupMembers.map((member) => (
                  <div
                    key={member.id}
                    className="tech-card rounded-xl p-6 flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-krs-cyan uppercase">
                          {member.teamGroup}
                        </span>
                        <span className="text-slate-500">
                          Since {member.startYear}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-display font-bold text-white text-lg group-hover:text-krs-cyan transition-colors">
                          {member.name}
                        </h3>
                        <p className="text-slate-300 text-xs font-mono mt-0.5">
                          {member.role}
                        </p>
                        <p className="text-slate-500 text-[11px] font-mono">
                          {member.department}
                        </p>
                      </div>

                      <p className="text-slate-400 text-xs leading-relaxed">
                        {member.bio}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-krs-border/60 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                      <span>Status: {member.active ? 'Active' : 'Alumni'}</span>
                      <span className="text-slate-400">IILM University</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
