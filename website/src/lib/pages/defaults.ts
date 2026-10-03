import { DEFAULT_SETTINGS } from '../site-settings-defaults'

/**
 * Built-in pages as they were written in code. On first start each one is created in the CMS (Pages) with
 * system = true; until then (or if the CMS is down) the site renders these. Edit content in the CMS, not here.
 */
export type BlockData = { blockType: string; [key: string]: any }
export type PageData = {
  path: string
  title: string
  seo: { title?: string; description?: string; image?: any; noIndex?: boolean }
  layout: BlockData[]
}

const items = (list: string[]) => list.map((item) => ({ item }))

export const DEFAULT_PAGES: Record<string, PageData> = {
  '/': {
    path: '/',
    title: 'KRS home',
    seo: {
      title: 'Kalam Robotics Society | IILM University, Greater Noida',
      description:
        'Official engineering laboratory and robotics society of IILM University Greater Noida. Autonomous rovers, embedded firmware, computer vision, and the national AURIX competition platform.',
    },
    layout: [
      {
        blockType: 'hero',
        theme: 'krs',
        eyebrow: 'IILM University, Greater Noida // Engineering Lab',
        title: 'KALAM ROBOTICS',
        titleAccent: 'SOCIETY',
        tagline: items(['LEARN.', 'BUILD.', 'COMPETE.', 'INNOVATE.']),
        intro:
          'The premier cyber-physical systems laboratory at IILM University. Advancing autonomous mobile robotics, real-time edge intelligence, and national technical competition excellence.',
        buttons: [
          { label: 'Explore KRS', href: '#about', style: 'primary' },
          { label: 'Enter AURIX Arena', href: '/aurix', style: 'secondary' },
        ],
      },
      {
        blockType: 'textChips',
        anchor: 'about',
        eyebrow: '01 // Institutional Foundation',
        title: 'Pioneering Applied Robotics at IILM University',
        body: DEFAULT_SETTINGS.about,
        linkLabel: 'Read society constitution & history',
        linkHref: '/insights',
        chipsTitle: 'Core Technical Domains',
        chips: items(DEFAULT_SETTINGS.domains),
      },
      {
        blockType: 'callout',
        theme: 'aurix',
        eyebrow: 'Flagship Competition Platform',
        title: 'AURIX 2026: National Robotics Arena & AI Challenge',
        intro:
          'Operated through Kalam Robotics Society, AURIX is the definitive annual collegiate robotics arena. Featuring Robo Soccer, precision Robo Race, research-grade Robo Expo, and multidisciplinary Robo Ideathon, with the Robotics & AI Hackathon coming soon.',
        buttons: [
          { label: 'View AURIX Competitions', href: '/aurix', style: 'primary' },
          { label: '24-Hour Hackathon Hub', href: '/aurix/hackathon', style: 'secondary' },
        ],
      },
      {
        blockType: 'cardGrid',
        eyebrow: '02 // Operational Pillars',
        title: 'Engineering Rigor in Every Discipline',
        columns: '4',
        cards: DEFAULT_SETTINGS.pillars.map((p, i) => ({
          icon: ['terminal', 'trophy', 'book-open', 'layers'][i] || 'cpu',
          title: p.title,
          text: p.description,
        })),
      },
      {
        blockType: 'featuredProject',
        visibleIf: '/projects',
        eyebrow: '03 // Flagship Engineering Dossier',
        statusLabel: 'Status:',
        benchmarkLabel: 'Validated Benchmark:',
        hardwareTitle: 'Hardware Subsystems',
        softwareTitle: 'Software Perception Stack',
        buttonLabel: 'View Complete Case Study',
      },
      {
        blockType: 'eventCards',
        eyebrow: '04 // AURIX 2026 Series',
        title: 'Active Competitions',
        linkLabel: 'All Competitions',
        linkHref: '/aurix',
        limit: 3,
        buttonLabel: 'View Details',
      },
      {
        blockType: 'resourceCards',
        visibleIf: '/learning',
        eyebrow: '05 // Knowledge Hub',
        title: 'Robotics Tutorials & Engineering Articles',
        linkLabel: 'All Resources',
        linkHref: '/learning',
        limit: 3,
        byLabel: 'By',
      },
      {
        blockType: 'blogCards',
        visibleIf: '/blogs',
        eyebrow: '06 // Society Dispatch',
        title: 'Latest Engineering Blogs & Stories',
        linkLabel: 'All Blogs',
        linkHref: '/blogs',
        limit: 2,
        readLabel: 'min read',
      },
      {
        blockType: 'cta',
        visibleIf: '/join',
        theme: 'krs',
        eyebrow: 'Recruitment // Season 2026–2027',
        title: 'Build the Future of Cyber-Physical Systems',
        intro:
          'KRS welcomes passionate developers, hardware enthusiasts, roboticists, and CAD designers across all academic years at IILM University.',
        buttons: [{ label: 'Apply to Join KRS', href: '/join', style: 'primary' }],
      },
    ],
  },
}
