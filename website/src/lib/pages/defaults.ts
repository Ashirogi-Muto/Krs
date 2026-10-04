import { DEFAULT_SETTINGS } from '../site-settings-defaults'

/**
 * Built-in pages as they were written in code. On first start each one is created in the CMS (Pages) with
 * system = true; until then (or if the CMS is down) the site renders these. Edit content in the CMS, not here.
 */
export type BlockData = { blockType: string; [key: string]: any }
export type PageData = {
  path: string
  title: string
  spacing?: 'compact' | 'roomy'
  width?: 'full' | 'large' | 'medium' | 'narrow'
  seo: { title?: string; description?: string; image?: any; noIndex?: boolean; ogPath?: string }
  layout: BlockData[]
}

const items = (list: string[]) => list.map((item) => ({ item }))

export const DEFAULT_PAGES: Record<string, PageData> = {
  '/': {
    path: '/',
    title: 'KRS home',
    spacing: 'roomy',
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
          { label: '12-Hour Hackathon Hub', href: '/aurix/hackathon', style: 'secondary' },
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
        feeSuffix: ' / team',
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
  '/projects': {
    path: '/projects',
    title: 'Projects',
    seo: {
      title: 'Engineering Projects Portfolio | Kalam Robotics Society',
      description:
        'Explore custom autonomous rovers, IoT agricultural sensors, multi-DOF hexapods, and robotics hardware engineered at IILM University Greater Noida.',
    },
    layout: [
      {
        blockType: 'pageHeader',
        eyebrow: 'Hardware & Software Systems // Engineering Portfolio',
        title: 'Robotics Project Portfolio',
        intro:
          'In-house cyber-physical systems designed, fabricated, and validated by multidisciplinary student engineering teams at IILM University.',
      },
      { blockType: 'projectGrid', buttonLabel: 'Dossier' },
    ],
  },
  '/learning': {
    path: '/learning',
    title: 'Learning',
    seo: {
      title: 'Robotics Knowledge Hub | Learning Resources',
      description:
        'Curated engineering tutorials, ROS2 architectural guides, embedded firmware codebooks, and PCB design principles published by Kalam Robotics Society.',
    },
    layout: [
      {
        blockType: 'pageHeader',
        eyebrow: 'Curriculum & Pedagogy // Knowledge Hub',
        title: 'Robotics Knowledge Hub',
        intro:
          'Open-access technical tutorials, hardware design guides, and software architecture walkthroughs crafted by society leads to elevate engineering standards.',
      },
      {
        blockType: 'resourceGrid',
        pills: items(['All', 'ROS / ROS2', 'ESP32', 'PCB Design', 'Embedded Systems', 'Computer Vision', 'Control Systems', 'CAD & 3D Printing']),
      },
    ],
  },
  '/blogs': {
    path: '/blogs',
    title: 'Blogs',
    seo: {
      title: 'Robotics Engineering Blogs & Recaps | Kalam Robotics Society',
      description:
        'Technical dispatches, design retrospectives, competition insights, and engineering tutorials from Kalam Robotics Society at IILM University Greater Noida.',
    },
    layout: [
      {
        blockType: 'pageHeader',
        eyebrow: 'Editorial & Dispatches // Society Blog',
        title: 'Robotics Insights & Chronicles',
        intro:
          'In-depth technical reflections, hardware teardowns, rover milestone logs, and competition updates authored by the engineers at KRS.',
      },
      {
        blockType: 'blogGrid',
        pills: items(['All', 'Project Stories', 'Club News', 'Robotics', 'AI', 'Tutorials', 'Event Recaps']),
        readLabel: 'min read',
        readMoreLabel: 'Read Article',
      },
    ],
  },
  '/gallery': {
    path: '/gallery',
    title: 'Gallery',
    seo: {
      title: 'Lab & Field Gallery | Kalam Robotics Society',
      description:
        'Visual documentation of robotic prototypes, workbench hardware, field trials, workshops, and national competition milestones at IILM University Greater Noida.',
    },
    layout: [
      {
        blockType: 'pageHeader',
        eyebrow: 'Visual Archives // Laboratory & Field',
        title: 'Engineering in Motion',
        intro:
          'Authoritative visual documentation of prototypes, laboratory experimentation, tournament competitions, and workshops conducted by Kalam Robotics Society.',
      },
      {
        blockType: 'galleryGrid',
        showFilter: true,
        allLabel: 'All',
        categories: items(['Projects', 'Competitions', 'Workshops', 'Lab Workbench']),
        emptyText: 'No albums in this category yet.',
        photoLabel: 'View Media in Google Drive',
        videoLabel: 'Watch Demonstration Footage',
      },
    ],
  },
  '/events': {
    path: '/events',
    title: 'Events',
    seo: {
      title: 'Robotics Competitions & Events | Kalam Robotics Society',
      description:
        'Gateway to official robotics challenges, workshops, and the flagship AURIX competition series at IILM University Greater Noida.',
    },
    layout: [
      {
        blockType: 'pageHeader',
        eyebrow: 'Competitive Arena & Workshops // Events Gateway',
        title: 'Robotics Events & Competitions',
        intro:
          'KRS hosts hands-on hardware training workshops, industry seminars, and the flagship annual AURIX robotics and AI competition circuit.',
      },
      {
        blockType: 'eventBanner',
        badge: 'Flagship Annual Competition',
        title: 'AURIX 2026',
        text: 'Robo Soccer, Robo Race, Robo Expo and Robo Ideathon — registrations are open. The Robotics & AI Hackathon is coming soon.',
        showDates: true,
        venue: 'IILM University, Greater Noida',
        buttons: [
          { label: 'Register Now', href: '/aurix/register', style: 'primary' },
          { label: 'View All Competitions', href: '/aurix', style: 'secondary' },
        ],
      },
      {
        blockType: 'eventCards',
        eyebrow: 'Tournament Roster',
        title: 'AURIX Competition Categories',
        limit: 10,
        buttonLabel: 'Full Specification',
        feeSuffix: '',
      },
    ],
  },
  '/insights': {
    path: '/insights',
    title: 'Insights',
    seo: {
      title: 'Society Insights & Philosophy | Kalam Robotics Society',
      description:
        'The engineering ethos, laboratory culture, competition philosophy, and milestones of Kalam Robotics Society at IILM University, Greater Noida.',
    },
    layout: [
      {
        blockType: 'pageHeader',
        eyebrow: 'Manifesto & Culture // Society Insights',
        title: 'Inside Kalam Robotics Society',
        intro:
          'Understanding the mission, engineering philosophy, and pedagogical culture that drive innovation at IILM University Greater Noida.',
      },
      {
        blockType: 'cardGrid',
        columns: '3',
        cards: [
          { icon: 'lightbulb', title: 'Learning Culture', text: 'We reject passive lectures in favor of hardware breadboarding, circuit soldering, oscilloscope debugging, and writing low-level drivers from scratch.' },
          { icon: 'target', title: 'Project Culture', text: 'Every project undergoes rigorous system architecture reviews, component budgeting, schematic verification, and systematic field benchmarks.' },
          { icon: 'compass', title: 'Competition Culture', text: 'Pressure tests engineering designs. We build reliable, tournament-ready machines engineered to withstand dynamic arena conditions and stringent time trials.' },
        ],
      },
      {
        blockType: 'timeline',
        eyebrow: 'Chronology // Milestones',
        title: 'Society Evolution & Milestones',
        items: [
          { year: '2024', title: 'Foundational Charter & Laboratory Commissioning', description: 'Established under the School of Engineering & Technology at IILM University Greater Noida, formalizing multi-disciplinary student hardware labs.' },
          { year: '2025', title: 'Flagship Mobile Robotics & IoT Initiative', description: 'Kickstarted the YUVAAN semi-autonomous rover platform and deployed IoT micro-grid sensor prototypes across campus grounds.' },
          { year: '2026', title: 'Launch of AURIX National Competition Series', description: 'Architected the national AURIX robotics platform, including the 12-Hour Robotics & AI Hackathon and collegiate arena competitions.' },
        ],
      },
      {
        blockType: 'notice',
        icon: 'shield',
        label: 'Verified Institutional Affiliation',
        title: 'IILM University, Greater Noida',
        text: 'Operating under academic oversight, Kalam Robotics Society bridges classroom theoretical mechanics and electromagnetics with real-world robotics development, autonomous vehicles, and international competition readiness.',
      },
    ],
  },
  '/team': {
    path: '/team',
    title: 'Team',
    seo: {
      title: 'Society Leadership & Faculty | Kalam Robotics Society',
      description:
        'Meet the faculty coordinators, executive leadership, and technical domain leads steering robotics research and competitions at IILM University Greater Noida.',
    },
    layout: [
      {
        blockType: 'pageHeader',
        eyebrow: 'Governance & Technical Leads // Society Directory',
        title: 'Leadership & Technical Core',
        intro:
          'The students and faculty coordinators directing operations, engineering laboratories, and competition platforms for Kalam Robotics Society at IILM University.',
      },
      {
        blockType: 'teamGrid',
        groups: [
          { group: 'FACULTY', title: 'Faculty Advisory & Oversight' },
          { group: 'LEADERSHIP', title: 'Executive Core Leadership' },
          { group: 'ELECTRONICS', title: 'Electronics & Embedded Systems Team' },
          { group: 'SOFTWARE_AI', title: 'Software, AI & Perception Team' },
        ],
        memberSingular: 'Member',
        memberPlural: 'Members',
        sinceLabel: 'Since',
        statusLabel: 'Status:',
        activeLabel: 'Active',
        alumniLabel: 'Alumni',
        footerText: 'IILM University',
      },
    ],
  },
  '/join': {
    path: '/join',
    title: 'Join KRS',
    width: 'narrow',
    seo: {
      title: 'Join Kalam Robotics Society | Membership Application',
      description: 'Apply to join Kalam Robotics Society at IILM University, Greater Noida.',
    },
    layout: [
      {
        blockType: 'pageHeader',
        eyebrow: 'Society Recruitment // Season 2026–2027',
        title: 'Apply to Join KRS',
        intro:
          'Open to all undergraduate and postgraduate engineering students at IILM University Greater Noida who are eager to commit to rigorous hands-on hardware and software development.',
      },
      {
        blockType: 'form',
        formName: 'KRS membership application',
        fields: [
          { label: 'Full Name', type: 'text', required: true, halfWidth: true, placeholder: 'e.g. Alex Sharma' },
          { label: 'Institutional Email', type: 'email', required: true, halfWidth: true, placeholder: 'name@iilm.edu' },
          { label: 'Student ID / Roll Number', type: 'text', required: true, halfWidth: true, placeholder: 'e.g. 2024CS012' },
          { label: 'Branch & Year', type: 'text', required: true, halfWidth: true, placeholder: 'e.g. B.Tech CSE / 2nd Year' },
          {
            label: 'Primary Domain of Interest',
            type: 'select',
            required: true,
            placeholder: 'Select Domain',
            options: items([
              'Autonomous Robotics & ROS2',
              'Embedded Systems & Custom PCB Design',
              'Computer Vision & Edge Deep Learning',
              'CAD, Mechanical Kinematics & 3D Prototyping',
              'Event Management & Media Operations',
            ]),
          },
          {
            label: 'Prior Experience or Key Projects (Optional)',
            type: 'textarea',
            placeholder: 'Detail any past microcontroller programming, CAD modeling, hackathon projects, or technical tools you have used.',
          },
        ],
        submitLabel: 'Submit Application',
        sendingLabel: 'Submitting Application...',
        successTitle: 'Application Received',
        successText:
          'Your membership application has been registered. The KRS Core Technical Committee will contact you for laboratory onboarding and initial interview rounds.',
      },
    ],
  },
  '/contact': {
    path: '/contact',
    title: 'Contact',
    seo: {
      title: 'Contact Kalam Robotics Society | IILM University',
      description: 'Competition inquiries, partnerships, sponsorships and laboratory visits — contact Kalam Robotics Society.',
    },
    layout: [
      {
        blockType: 'pageHeader',
        eyebrow: 'Official Inquiries // Contact Hub',
        title: 'Connect with Kalam Robotics Society',
        intro:
          'For competition inquiries, institutional partnerships, sponsorship discussions, or laboratory visits at IILM University Greater Noida.',
      },
      {
        blockType: 'form',
        formName: 'Contact message',
        fields: [
          { label: 'Your Name', type: 'text', required: true, halfWidth: true },
          { label: 'Email Address', type: 'email', required: true, halfWidth: true },
          { label: 'Subject', type: 'text', required: true, placeholder: 'e.g. AURIX 2026 Hackathon Inquiry' },
          { label: 'Message', type: 'textarea', required: true },
        ],
        submitLabel: 'Send Inscription',
        sendingLabel: 'Sending…',
        successTitle: 'Message Dispatched',
        successText: 'Your message has been received by the organizing committee. We will respond via official correspondence.',
        contactItems: [
          {
            icon: 'map-pin',
            title: 'Physical Laboratory Location',
            text: 'Kalam Robotics Society Laboratory\nSchool of Engineering & Technology\nIILM University, Greater Noida\nKnowledge Park II, Greater Noida, Uttar Pradesh, India',
          },
          {
            icon: 'mail',
            title: 'Official Society Correspondence',
            text: 'General inquiries & AURIX support:',
            highlight: 'contact@kalamrobotics.in',
          },
        ],
      },
    ],
  },

  '/aurix': {
    path: '/aurix',
    title: 'AURIX home',
    spacing: 'roomy',
    seo: {
      title: 'AURIX 2026 | National Robotics & AI Competition Arena',
      description:
        'National robotics arena hosted by Kalam Robotics Society at IILM University Greater Noida. Robo Soccer, Robo Race, Robo Expo and Robo Ideathon.',
    },
    layout: [
      {
        blockType: 'hero',
        theme: 'aurix',
        builtinImage: 'aurix-logo-full',
        eyebrow: 'IILM University Greater Noida // National Robotics Arena',
        title: 'AURIX 2026',
        titleAccent: 'COMPETITION ARENA',
        tagline: [
          { item: '{dates}' },
          { item: 'GREATER NOIDA' },
          { item: '{prizePool} PRIZE POOL', highlight: true },
          { item: 'NATIONAL STAGE' },
        ],
        intro:
          'The flagship competitive robotics championship organized by Kalam Robotics Society. Robo Soccer, Robo Race, Robo Expo and Robo Ideathon — with the Robotics & AI Hackathon coming soon.',
        showCountdown: true,
        countdownLabel: 'Tournament Commences In',
        buttons: [
          { label: 'Explore Competitions', href: '/aurix/competitions', style: 'primary' },
          { label: 'Participant Portal Login', href: '/aurix/portal', style: 'secondary' },
        ],
      },
      {
        blockType: 'eventCards',
        eyebrow: 'Tournament Roster // 2026 Edition',
        title: 'Official Competition Categories',
        intro: 'Select a competition category below to review technical specifications, arena rules, and team requirements.',
        limit: 10,
        variant: 'large',
        feeSuffix: ' / team',
        buttonLabel: 'Inspect Rulebook',
        teamFallback: 'Team Entry',
      },
      {
        blockType: 'steps',
        theme: 'aurix',
        eyebrow: 'Operational Blueprint',
        title: 'How to Compete in AURIX',
        steps: [
          { title: 'Select Challenge', text: 'Review technical constraints, team composition limits, and arena requirements across the 5 competitions.' },
          { title: 'Form Your Team', text: 'Register via the Participant Portal, generate cryptographic invite links, and confirm team members.' },
          { title: 'Screening & Verification', text: 'Submit your technical proposal or robot specifications for jury review and qualification shortlisting.' },
          { title: 'Arena Prototyping', text: 'Compete on-site at IILM University Greater Noida on {dates} before official technical judges.' },
        ],
      },
      {
        blockType: 'comparisonTable',
        eyebrow: 'Quick Comparison Matrix',
        title: 'Category Specifications at a Glance',
        colName: 'Competition',
        colTeam: 'Team Composition',
        colFee: 'Registration Fee',
        colPrize: 'Prize Pool',
        colSpecs: 'Robot Constraints',
        colDates: 'Dates',
      },
      {
        blockType: 'cta',
        visibleIf: '/aurix/portal',
        theme: 'aurix',
        eyebrow: 'Participant Hub // Autonomous Operations',
        title: 'Enter the Participant Portal',
        intro:
          'Create and manage your competition squad, generate team invitation tokens, monitor proposal screening status, and access live tournament announcements.',
        buttons: [{ label: 'Access Portal Dashboard', href: '/aurix/portal', style: 'primary' }],
      },
    ],
  },
  '/aurix/competitions': {
    path: '/aurix/competitions',
    title: 'Competitions',
    seo: {
      title: 'All AURIX Competitions | Tournament Roster',
      description: 'Comprehensive directory of all robotics competitions and challenges in the AURIX 2026 series at IILM University Greater Noida.',
    },
    layout: [
      {
        blockType: 'pageHeader',
        theme: 'aurix',
        eyebrow: 'Competitive Tracks // AURIX 2026',
        title: 'Tournament Competitions',
        intro:
          'Five specialized competitive tracks designed to evaluate rapid cyber-physical prototyping, remote mechanical piloting, research rigor, and multidisciplinary ideation.',
      },
      {
        blockType: 'eventCards',
        limit: 10,
        variant: 'large',
        feeSuffix: ' / team',
        showPrizePool: true,
        prizeLabel: 'Prize pool',
        teamPrefix: 'Team: ',
        teamFallback: 'Team Entry',
        buttonLabel: 'Inspect Specs',
      },
    ],
  },
  '/aurix/rules': {
    path: '/aurix/rules',
    title: 'Rules',
    width: 'large',
    seo: {
      title: 'Official Technical Rulebooks | AURIX 2026',
      description: 'Crawlable technical rulebooks, robot dimension constraints, generative AI policies, and safety protocols for all AURIX 2026 competitions.',
    },
    layout: [
      {
        blockType: 'pageHeader',
        theme: 'aurix',
        eyebrow: 'Technical Specifications & Policies // AURIX 2026',
        title: 'Official Tournament Rulebooks',
        intro: 'Comprehensive, crawlable technical rules governing vehicle dimensions, power safety, software repositories, team compositions, and AI disclosure.',
      },
      {
        blockType: 'eventRulebooks',
        badgePrefix: 'Rulebook // ',
        buttonLabel: 'View Full Event Page',
        feeLabel: 'Fee',
        teamLabel: 'Team Size',
        datesLabel: 'Dates',
        versionLabel: 'Version',
        versionValue: 'v1.0 (Official)',
        unpricedLabel: 'Unpriced',
        noticeLabel: 'Notice:',
        teamFallback: 'Team Entry',
      },
    ],
  },
  '/aurix/faq': {
    path: '/aurix/faq',
    title: 'FAQ',
    width: 'medium',
    seo: {
      title: 'Tournament FAQ | AURIX 2026',
      description:
        'Frequently asked questions regarding team registration, hardware rules, eligibility, and the 12-Hour Hackathon at AURIX 2026 IILM University.',
    },
    layout: [
      {
        blockType: 'pageHeader',
        theme: 'aurix',
        eyebrow: 'Support & Guidance // AURIX FAQ',
        title: 'Frequently Asked Questions',
        intro: 'Official answers covering eligibility, team size constraints, hardware policies, and judging procedures across all AURIX competitions.',
      },
      { blockType: 'eventFaqs', titleSuffix: ' FAQ' },
    ],
  },
  '/aurix/schedule': {
    path: '/aurix/schedule',
    title: 'Schedule',
    width: 'large',
    seo: {
      title: 'Master Tournament Schedule | AURIX 2026',
      description: 'Event-day schedule and official dates for AURIX 2026 competitions at IILM University, Greater Noida.',
    },
    layout: [
      {
        blockType: 'pageHeader',
        theme: 'aurix',
        eyebrow: 'Master Timeline // AURIX 2026',
        title: 'Tournament Schedule',
        intro: 'Event-day timings for AURIX 2026 at IILM University, Greater Noida.',
      },
      { blockType: 'schedule', emptyText: 'Detailed timings will be published here. Official event dates:' },
    ],
  },
  '/aurix/results': {
    path: '/aurix/results',
    title: 'Results',
    width: 'medium',
    seo: {
      title: 'Official Tournament Results | AURIX 2026',
      description:
        'Verified podium finishes, rankings, and special category awards published by the official AURIX 2026 jury at IILM University Greater Noida.',
    },
    layout: [
      {
        blockType: 'pageHeader',
        theme: 'aurix',
        eyebrow: 'Official Adjudication // AURIX 2026',
        title: 'Tournament Results & Awards',
        intro: 'Official podium rankings, technical excellence awards, and prize allocations validated by the AURIX jury and Kalam Robotics Society.',
      },
      {
        blockType: 'results',
        pendingBadge: 'Tournament In Progress // Adjudication Pending',
        pendingTitle: 'Official Results Pending',
        pendingText: 'Official results, scores, and podium awards will be verified and published here following jury deliberation.',
        pendingButtons: [
          { label: 'View Evaluation Schedule', href: '/aurix/schedule', style: 'secondary' },
          { label: 'Participant Portal', href: '/aurix/portal', style: 'primary' },
        ],
      },
    ],
  },
  '/aurix/status': {
    path: '/aurix/status',
    title: 'Registration status',
    width: 'medium',
    seo: {
      title: 'Registration Status | AURIX 2026',
      description: 'Check the status of your AURIX 2026 team registration, payment and ID verification.',
      noIndex: true,
    },
    layout: [
      {
        blockType: 'pageHeader',
        theme: 'aurix',
        align: 'center',
        eyebrow: 'AURIX 2026 // Registration status',
        title: 'Check Your Registration',
        intro: "Enter the registration code you received and the team leader's email. Not registered yet?",
        introLinkLabel: 'Register your team',
        introLinkHref: '/aurix/register',
        introAfter: '.',
      },
      { blockType: 'statusLookup' },
    ],
  },
  '/aurix/register': {
    path: '/aurix/register',
    title: 'Register',
    width: 'medium',
    seo: {
      title: 'Register | AURIX 2026',
      description: 'Register your team for AURIX 2026 competitions at IILM University, Greater Noida.',
      ogPath: '/og?title=Register%20your%20team&subtitle=AURIX%202026%20%C2%B7%20Robo%20Soccer%2C%20Race%2C%20Expo%20%26%20Ideathon',
    },
    layout: [
      {
        blockType: 'pageHeader',
        theme: 'aurix',
        align: 'center',
        eyebrow: 'AURIX 2026 // Registration',
        title: 'Register Your Team',
        intro:
          "Fill in your team details and upload each member's student ID. You'll then be taken to the payment page with your details already filled in. Already registered?",
        introLinkLabel: 'Check your status',
        introLinkHref: '/aurix/status',
        introAfter: '.',
      },
      { blockType: 'registrationForm', closedText: 'Registration is not open right now. Please check back soon.' },
    ],
  },

}
