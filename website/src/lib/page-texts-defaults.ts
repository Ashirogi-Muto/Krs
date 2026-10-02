/** Headings and intro texts of the main pages as they were written in code (defaults for CMS "Page texts"). */
export const DEFAULT_PAGE_TEXTS = {
  home: {
    heroEyebrow: 'IILM University, Greater Noida // Engineering Lab',
    heroIntro:
      'The premier cyber-physical systems laboratory at IILM University. Advancing autonomous mobile robotics, real-time edge intelligence, and national technical competition excellence.',
    aboutEyebrow: '01 // Institutional Foundation',
    aboutTitle: 'Pioneering Applied Robotics at IILM University',
    domainsTitle: 'Core Technical Domains',
    aurixEyebrow: 'Flagship Competition Platform',
    aurixTitle: 'AURIX 2026: National Robotics Arena & AI Challenge',
    aurixIntro:
      'Operated through Kalam Robotics Society, AURIX is the definitive annual collegiate robotics arena. Featuring Robo Soccer, precision Robo Race, research-grade Robo Expo, and multidisciplinary Robo Ideathon, with the Robotics & AI Hackathon coming soon.',
    aurixButton: 'View AURIX Competitions',
    hackathonButton: '24-Hour Hackathon Hub',
    pillarsEyebrow: '02 // Operational Pillars',
    pillarsTitle: 'Engineering Rigor in Every Discipline',
  },
  aurix: {
    heroEyebrow: 'IILM University Greater Noida // National Robotics Arena',
    heroIntro:
      'The flagship competitive robotics championship organized by Kalam Robotics Society. Robo Soccer, Robo Race, Robo Expo and Robo Ideathon — with the Robotics & AI Hackathon coming soon.',
    exploreButton: 'Explore Competitions',
    portalButton: 'Participant Portal Login',
    categoriesEyebrow: 'Tournament Roster // 2026 Edition',
    categoriesTitle: 'Official Competition Categories',
    categoriesIntro: 'Select a competition category below to review technical specifications, arena rules, and team requirements.',
    stepsEyebrow: 'Operational Blueprint',
    stepsTitle: 'How to Compete in AURIX',
    steps: [
      { title: 'Select Challenge', text: 'Review technical constraints, team composition limits, and arena requirements across the 5 competitions.' },
      { title: 'Form Your Team', text: 'Register via the Participant Portal, generate cryptographic invite links, and confirm team members.' },
      { title: 'Screening & Verification', text: 'Submit your technical proposal or robot specifications for jury review and qualification shortlisting.' },
      { title: 'Arena Prototyping', text: 'Compete on-site at IILM University Greater Noida on {dates} before official technical judges.' },
    ],
    comparisonEyebrow: 'Quick Comparison Matrix',
    comparisonTitle: 'Category Specifications at a Glance',
  },
  competitions: {
    eyebrow: 'Competitive Tracks // AURIX 2026',
    title: 'Tournament Competitions',
    intro:
      'Five specialized competitive tracks designed to evaluate rapid cyber-physical prototyping, remote mechanical piloting, research rigor, and multidisciplinary ideation.',
  },
  faq: {
    eyebrow: 'Support & Guidance // AURIX FAQ',
    title: 'Frequently Asked Questions',
    intro: 'Official answers covering eligibility, team size constraints, hardware policies, and judging procedures across all AURIX competitions.',
  },
  rules: {
    eyebrow: 'Technical Specifications & Policies // AURIX 2026',
    title: 'Official Tournament Rulebooks',
    intro: 'Comprehensive, crawlable technical rules governing vehicle dimensions, power safety, software repositories, team compositions, and AI disclosure.',
  },
  insights: {
    eyebrow: 'Manifesto & Culture // Society Insights',
    title: 'Inside Kalam Robotics Society',
    intro:
      'Understanding the mission, engineering philosophy, and pedagogical culture that drive innovation at IILM University Greater Noida.',
    cultures: [
      { title: 'Learning Culture', text: 'We reject passive lectures in favor of hardware breadboarding, circuit soldering, oscilloscope debugging, and writing low-level drivers from scratch.' },
      { title: 'Project Culture', text: 'Every project undergoes rigorous system architecture reviews, component budgeting, schematic verification, and systematic field benchmarks.' },
      { title: 'Competition Culture', text: 'Pressure tests engineering designs. We build reliable, tournament-ready machines engineered to withstand dynamic arena conditions and stringent time trials.' },
    ],
    timelineEyebrow: 'Chronology // Milestones',
    timelineTitle: 'Society Evolution & Milestones',
    timeline: [
      { year: '2024', title: 'Foundational Charter & Laboratory Commissioning', description: 'Established under the School of Engineering & Technology at IILM University Greater Noida, formalizing multi-disciplinary student hardware labs.' },
      { year: '2025', title: 'Flagship Mobile Robotics & IoT Initiative', description: 'Kickstarted the YUVAAN semi-autonomous rover platform and deployed IoT micro-grid sensor prototypes across campus grounds.' },
      { year: '2026', title: 'Launch of AURIX National Competition Series', description: 'Architected the national AURIX robotics platform, including the 24-Hour Robotics & AI Hackathon and collegiate arena competitions.' },
    ],
    affiliationLabel: 'Verified Institutional Affiliation',
    affiliationTitle: 'IILM University, Greater Noida',
    affiliationText:
      'Operating under academic oversight, Kalam Robotics Society bridges classroom theoretical mechanics and electromagnetics with real-world robotics development, autonomous vehicles, and international competition readiness.',
  },
  gallery: {
    eyebrow: 'Visual Archives // Laboratory & Field',
    title: 'Engineering in Motion',
    intro: 'Authoritative visual documentation of prototypes, laboratory experimentation, tournament competitions, and workshops conducted by Kalam Robotics Society.',
  },
}
export type PageTexts = typeof DEFAULT_PAGE_TEXTS
