/** Menus and footers as they were written in code: defaults for the CMS global "Navigation & footer". */
export type NavLink = { label: string; href: string; style?: 'primary' | 'secondary' | 'link' }
export type FooterColumn = { heading: string; accent: 'plain' | 'krs' | 'aurix'; links: NavLink[] }
export type SiteNav = {
  brandTitle: string
  brandSubtitle: string
  logo: string
  links: NavLink[]
  ctas: NavLink[]
  backLabel?: string
  footerColumns: FooterColumn[]
  footerBlurb: string
  footerAddress: string
  footerNote: string
  bottomLinks: NavLink[]
}
export type NavigationData = { krs: SiteNav; aurix: SiteNav }

export const DEFAULT_NAVIGATION: NavigationData = {
  krs: {
    brandTitle: 'KALAM ROBOTICS SOCIETY',
    brandSubtitle: 'IILM University, Greater Noida',
    logo: '/images/krs-mark-light.png',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Projects', href: '/projects' },
      { label: 'Learning', href: '/learning' },
      { label: 'Events', href: '/events' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'Blogs', href: '/blogs' },
      { label: 'Insights', href: '/insights' },
      { label: 'Team', href: '/team' },
    ],
    ctas: [
      { label: 'AURIX Arena', href: '/aurix', style: 'link' },
      { label: 'Join KRS', href: '/join', style: 'primary' },
    ],
    footerColumns: [
      {
        heading: 'Society',
        accent: 'plain',
        links: [
          { label: 'Engineering Projects', href: '/projects' },
          { label: 'Robotics Knowledge Hub', href: '/learning' },
          { label: 'Workshops & Events', href: '/events' },
          { label: 'Lab & Field Gallery', href: '/gallery' },
          { label: 'Society Insights', href: '/insights' },
          { label: 'Society Leadership', href: '/team' },
        ],
      },
      {
        heading: 'AURIX Arena',
        accent: 'aurix',
        links: [
          { label: 'Robotics & AI Hackathon', href: '/aurix/hackathon' },
          { label: 'AURIX Robo Soccer', href: '/aurix/robo-soccer' },
          { label: 'AURIX Robo Race', href: '/aurix/robo-race' },
          { label: 'AURIX Robo Expo', href: '/aurix/robo-expo' },
          { label: 'AURIX Robo Ideathon', href: '/aurix/robo-ideathon' },
          { label: 'Master Event Schedule', href: '/aurix/schedule' },
          { label: 'Official Rulebooks', href: '/aurix/rules' },
        ],
      },
      {
        heading: 'Operations & Legal',
        accent: 'plain',
        links: [
          { label: 'Apply for Membership', href: '/join' },
          { label: 'Official Contact', href: '/contact' },
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Terms of Service', href: '/terms' },
          { label: 'CMS Administration', href: '/admin' },
        ],
      },
    ],
    footerBlurb: '', // empty = Site settings → footer text
    footerAddress: '', // empty = Site settings → institution + location
    footerNote: '© {year} {name}, {institution}. All rights reserved.',
    bottomLinks: [],
  },
  aurix: {
    brandTitle: 'AURIX 2026',
    brandSubtitle: 'Robotics Competition Arena',
    logo: '/images/aurix-mark.png',
    backLabel: 'Return to KRS',
    links: [
      { label: 'AURIX Arena', href: '/aurix' },
      { label: 'Competitions', href: '/aurix/competitions' },
      { label: 'Schedule', href: '/aurix/schedule' },
      { label: 'Rules', href: '/aurix/rules' },
      { label: 'Results', href: '/aurix/results' },
      { label: 'FAQ', href: '/aurix/faq' },
    ],
    ctas: [{ label: 'Participant Portal', href: '/aurix/portal', style: 'primary' }],
    footerColumns: [
      {
        heading: 'Competitions',
        accent: 'plain',
        links: [
          { label: 'Robotics & AI Hackathon (Coming Soon)', href: '/aurix/hackathon' },
          { label: 'AURIX Robo Soccer', href: '/aurix/robo-soccer' },
          { label: 'AURIX Robo Race', href: '/aurix/robo-race' },
          { label: 'AURIX Robo Expo', href: '/aurix/robo-expo' },
          { label: 'AURIX Robo Ideathon', href: '/aurix/robo-ideathon' },
        ],
      },
      {
        heading: 'Tournament Operations',
        accent: 'plain',
        links: [
          { label: 'Participant Dashboard', href: '/aurix/portal' },
          { label: 'Master Timeline', href: '/aurix/schedule' },
          { label: 'Official Technical Rulebooks', href: '/aurix/rules' },
          { label: 'Published Results', href: '/aurix/results' },
          { label: 'Frequently Asked Questions', href: '/aurix/faq' },
        ],
      },
      {
        heading: 'KRS Society',
        accent: 'krs',
        links: [
          { label: 'KRS Public Society', href: '/' },
          { label: 'Rover & Hardware Portfolio', href: '/projects' },
          { label: 'Robotics Knowledge Hub', href: '/learning' },
          { label: 'Society Leadership', href: '/team' },
          { label: 'Privacy Policy', href: '/privacy' },
        ],
      },
    ],
    footerBlurb:
      'National robotics tournament & hackathon arena powered by Kalam Robotics Society at IILM University, Greater Noida.',
    footerAddress: 'Venue: IILM University\nGreater Noida, UP, India',
    footerNote: 'AURIX 2026 // Kalam Robotics Society // IILM University Greater Noida',
    bottomLinks: [{ label: 'Tournament Terms & Code of Conduct', href: '/terms' }],
  },
}
