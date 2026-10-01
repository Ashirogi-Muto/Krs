import { GenericEvent } from './types'

export const SEED_AURIX_EVENTS: GenericEvent[] = [
  {
    id: 'aurix-hackathon-2026',
    title: 'KRS Robotics & AI Hackathon 2026',
    shortName: 'Robotics & AI Hackathon',
    slug: 'hackathon',
    edition: '2026',
    series: 'AURIX',
    eventType: 'HACKATHON',
    status: 'REGISTRATION_OPEN',
    description:
      'A 24-hour national robotics and artificial intelligence challenge bringing together top student innovators, engineers, and researchers to architect and prototype next-generation cyber-physical systems and intelligent agents.',
    shortDescription:
      '24-hour national challenge tackling 9 advanced domains with a ₹1,00,000 prize pool and 50 shortlisted national teams.',
    startDate: '2026-10-29T09:00:00+05:30',
    endDate: '2026-10-30T17:00:00+05:30',
    registrationOpen: '2026-09-01T00:00:00+05:30',
    registrationClose: '2026-10-18T23:59:59+05:30',
    timezone: 'Asia/Kolkata',
    venue: 'IILM University, Greater Noida',
    location: 'Greater Noida, Uttar Pradesh, India',
    registrationFee: null, // Left unset per authoritative brochure facts; zero invention
    currency: 'INR',
    minTeamSize: 5,
    maxTeamSize: 5, // Exactly 5 participants per authoritative brochure facts
    participantRequirements:
      'Inter-college teams permitted. Each team must consist of exactly 5 participants. All participants must hold valid student credentials.',
    requiresPayment: false,
    requiresSubmission: true,
    requiresJudging: true,
    resultsPublished: false,
    featured: true,
    tracks: [
      {
        id: 'track-1',
        number: 1,
        name: 'Autonomous Campus & Smart Infrastructure',
        mission:
          'Design self-navigating robotics, intelligent energy grids, or automated facility inspection systems that streamline university and municipal operations.',
        examples: ['Autonomous maintenance rovers', 'Intelligent smart lighting micro-grids', 'Structural health acoustic analyzers'],
      },
      {
        id: 'track-2',
        number: 2,
        name: 'Disaster Response & Search / Rescue',
        mission:
          'Engineer resilient robotic platforms and sensor fusion suites to navigate hazardous environments, detect survivors, and map collapsed zones.',
        examples: ['Thermal-imaging survivor detection drones', 'Tethered crawler rovers for rubble penetration', 'Swarm mesh relays'],
      },
      {
        id: 'track-3',
        number: 3,
        name: 'Smart Logistics & Warehouse Automation',
        mission:
          'Create high-throughput automated guided vehicles (AGVs), sorting mechanisms, and multi-agent fleet dispatch algorithms.',
        examples: ['Dynamic SLAM sorting AGVs', 'Automated robotic bin picking', 'Autonomous pallet management'],
      },
      {
        id: 'track-4',
        number: 4,
        name: 'Smart Agriculture & Environmental',
        mission:
          'Build precision robotics and edge AI monitoring devices for automated crop care, soil health telemetry, and water conservation.',
        examples: ['Autonomous selective weeding rovers', 'Hyperspectral soil probes', 'Canopy monitoring UAVs'],
      },
      {
        id: 'track-5',
        number: 5,
        name: 'Healthcare & Assistive Robotics',
        mission:
          'Develop robotic prosthetics, tele-rehabilitation hardware, patient mobility exoskeletons, or sterile medication dispatch systems.',
        examples: ['EMG-controlled bionic grippers', 'Smart motorized wheelchair guidance', 'Vital sign robotic carts'],
      },
      {
        id: 'track-6',
        number: 6,
        name: 'Industry 5.0 & Human-Robot Collaboration',
        mission:
          'Design safe, intuitive collaborative robots (cobots), real-time operator pose tracking, and adaptive industrial assembly units.',
        examples: ['Force-feedback assembly cobots', 'Computer vision operator zone safety', 'Ergonomic worker assist jigs'],
      },
      {
        id: 'track-7',
        number: 7,
        name: 'Computer Vision & Multimodal AI',
        mission:
          'Deploy state-of-the-art visual perception, 3D LiDAR point cloud processing, and audio-visual intelligence for real-time edge hardware.',
        examples: ['Embedded stereo vision odometry', 'Real-time multi-object defect inspection', 'Multimodal sensor fusion'],
      },
      {
        id: 'track-8',
        number: 8,
        name: 'Generative AI & Agentic Systems',
        mission:
          'Build embodied reasoning agents where large language and multimodal models translate natural language into kinematic action plans.',
        examples: ['Voice-directed robotic arms', 'Autonomous agent task planners', 'Self-debugging robotic routines'],
      },
      {
        id: 'track-9',
        number: 9,
        name: 'Open Innovation',
        mission:
          'Pioneer original interdisciplinary robotics and cybernetics systems addressing high-impact real-world dilemmas not covered above.',
        examples: ['Aquatic waste skimmers', 'Bio-inspired kinetic mechanisms', 'Extreme weather instrumentation'],
      },
    ],
    rounds: [
      {
        id: 'round-1',
        number: 1,
        name: 'Round 1 — Online Screening',
        description:
          'Submission of abstract, system architecture blueprint, component selection, and technical proposal. Target shortlist: 50 teams.',
        startDate: '2026-09-01T00:00:00+05:30',
        endDate: '2026-10-20T23:59:59+05:30',
        submissionType: 'PROPOSAL',
        evaluationFormat: 'Online proposal review and technical feasibility assessment.',
      },
      {
        id: 'round-2',
        number: 2,
        name: 'Round 2 — Offline 24-Hour Build',
        description:
          'On-site intense prototyping and implementation marathon at IILM University Greater Noida campus.',
        startDate: '2026-10-29T09:00:00+05:30',
        endDate: '2026-10-30T09:00:00+05:30',
        submissionType: 'CODE_AND_DEMO',
        evaluationFormat: 'Midpoint progress checkpoints, mentor reviews, and functional hardware/software validation.',
      },
      {
        id: 'round-3',
        number: 3,
        name: 'Round 3 — Offline Final Evaluation',
        description:
          'Rigorous final judging: 5-minute technical pitch, 7-minute live demonstration, and 5-minute deep technical Q&A with industry judges.',
        startDate: '2026-10-30T10:00:00+05:30',
        endDate: '2026-10-30T16:00:00+05:30',
        submissionType: 'IN_PERSON_DEMO',
        evaluationFormat: '5-min Pitch + 7-min Demo + 5-min Q&A',
      },
    ],
    schedule: [
      { timeLabel: 'Hour 00:00 (09:00 AM)', title: 'Official Kickoff & Track Allocation', description: 'Briefing, hardware workspace allocation, and sprint start.' },
      { timeLabel: 'Hour 02:00 (11:00 AM)', title: 'Architecture Checkpoint', description: 'Technical design approval with mentor panel.' },
      { timeLabel: 'Hour 06:00 (03:00 PM)', title: 'First Mentor Technical Review', description: 'Hardware interface and pipeline milestone evaluation.' },
      { timeLabel: 'Hour 12:00 (09:00 PM)', title: 'Midpoint System Test', description: 'Core functional logic test and safety check.' },
      { timeLabel: 'Hour 18:00 (03:00 AM)', title: 'System Integration Sprint', description: 'End-to-end hardware-software pipeline synchronization.' },
      { timeLabel: 'Hour 23:00 (08:00 AM)', title: 'Code Freeze & Dossier Lock', description: 'Git freeze and final submission repository locking.' },
      { timeLabel: 'Hour 24:00 (09:00 AM)', title: 'Build Concludes & Evaluation Begins', description: 'Transition to final judging stages.' },
    ],
    rulesSections: [
      {
        title: 'Team Formation & Format',
        rules: [
          'Teams must consist of exactly 5 participants. No exceptions.',
          'Inter-college and inter-departmental teams are welcomed and permitted.',
          'Every participant must be an active enrolled student with valid institutional ID.',
          'Each team must appoint a single Team Lead for official communication and submission authority.',
        ],
      },
      {
        title: 'Hardware & Prototyping Policy',
        rules: [
          'Pre-assembled complete systems or commercial off-the-shelf clones are strictly prohibited.',
          'Modular hardware components (sensors, MCUs, chassis kits, breakout boards) are permitted.',
          'Software tracks do not require physical hardware, but a demonstrable robotics and/or AI contribution is mandatory.',
        ],
      },
      {
        title: 'Software & Generative AI Policy',
        rules: [
          'Generative AI tools (LLMs, code generation, schematic helpers) are permitted.',
          'Substantial AI assistance must be explicitly disclosed in the submission dossier.',
          'All software repositories must be created fresh during Round 2. Pre-existing codebases will be disqualified.',
        ],
      },
      {
        title: 'Originality & Integrity',
        rules: [
          'Solutions must be original student work.',
          'Direct duplication of existing public GitHub repositories will result in immediate disqualification.',
          'Mentors and judges possess final authority on originality evaluations.',
        ],
      },
    ],
    faqs: [
      {
        question: 'Are inter-college teams allowed for the Hackathon?',
        answer: 'Yes, inter-college and inter-disciplinary teams are fully permitted. All members must be registered students.',
      },
      {
        question: 'What is the required team size?',
        answer: 'Exactly 5 participants. The registration portal enforces this exact team composition.',
      },
      {
        question: 'Is hardware provided by the organizers?',
        answer: 'Standard lab facilities, power, 3D printers, and test areas are provided. Teams must bring their core development boards, sensors, and specialized components.',
      },
      {
        question: 'Can teams use Generative AI tools?',
        answer: 'Yes, modern AI tools are permitted, but teams must formally disclose substantial AI assistance in their project dossier.',
      },
    ],
  },
  {
    id: 'aurix-robo-soccer',
    title: 'AURIX Robo Soccer',
    shortName: 'Robo Soccer',
    slug: 'robo-soccer',
    edition: '2026',
    series: 'AURIX',
    eventType: 'ROBO_SOCCER',
    status: 'REGISTRATION_OPEN',
    description:
      'High-octane robotic football arena battle where custom remote-controlled robots compete in tactical, mechanical soccer matches under strict physical size and weight regulations.',
    shortDescription:
      '₹699 per team. Teams of 1–3 participants. Remote controlled, max 30x30x20 cm and 5 kg.',
    startDate: '2026-10-29T10:00:00+05:30',
    endDate: '2026-10-30T16:00:00+05:30',
    registrationOpen: '2026-09-01T00:00:00+05:30',
    registrationClose: '2026-10-25T23:59:59+05:30',
    timezone: 'Asia/Kolkata',
    venue: 'IILM University, Greater Noida',
    location: 'Greater Noida, Uttar Pradesh, India',
    registrationFee: 699,
    currency: 'INR',
    minTeamSize: 1,
    maxTeamSize: 3,
    participantRequirements: 'Teams of 1 to 3 participants. All participants must be students.',
    requiresPayment: true,
    requiresSubmission: false,
    requiresJudging: true,
    resultsPublished: false,
    featured: true,
    mediaGalleryUrl: 'https://drive.google.com/drive/folders/1-q426Z-Jg61gmAh5BOufhORnx-S3Yu0h',
    specialNotice: 'The exact arena configuration and obstacle layout is revealed during the event.',
    rulesSections: [
      {
        title: 'Robot Specifications',
        rules: [
          'Maximum dimensions: Length 30 cm, Width 30 cm, Height 20 cm.',
          'Maximum weight: 5.0 kg (including onboard battery).',
          'Control: Wired or wireless remote control (RF, Bluetooth, Wi-Fi, 2.4 GHz).',
          'Power: Max onboard DC voltage limit per safety regulations.',
        ],
      },
      {
        title: 'Arena & Match Structure',
        rules: [
          'Multiple elimination and league rounds.',
          'The exact arena configuration is revealed during the event on competition day.',
          'Kicking, dribbling, or pushing mechanisms are permitted provided they conform to size limits.',
          'Entanglement or intentional destructive weapons (saws, flames, acid) are strictly forbidden.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is the registration fee for Robo Soccer?',
        answer: '₹699 per team.',
      },
      {
        question: 'Can the robot be wired?',
        answer: 'Yes, both wired and wireless remote-controlled robots are permitted.',
      },
      {
        question: 'Can we know the arena layout in advance?',
        answer: 'No, the exact arena configuration is intentionally revealed on-site during the event.',
      },
    ],
  },
  {
    id: 'aurix-robo-race',
    title: 'AURIX Robo Race',
    shortName: 'Robo Race',
    slug: 'robo-race',
    edition: '2026',
    series: 'AURIX',
    eventType: 'ROBO_RACE',
    status: 'REGISTRATION_OPEN',
    description:
      'Precision obstacle time-trial racing where agile remote-controlled robots navigate sharp corners, inclines, friction strips, and dynamic hurdles under strict timing rules.',
    shortDescription:
      '₹699 per team. One operator. Max 30x25x20 cm and 5 kg. Track intentionally undisclosed beforehand.',
    startDate: '2026-10-29T10:00:00+05:30',
    endDate: '2026-10-30T16:00:00+05:30',
    registrationOpen: '2026-09-01T00:00:00+05:30',
    registrationClose: '2026-10-25T23:59:59+05:30',
    timezone: 'Asia/Kolkata',
    venue: 'IILM University, Greater Noida',
    location: 'Greater Noida, Uttar Pradesh, India',
    registrationFee: 699,
    currency: 'INR',
    minTeamSize: null, // Pre-flight correction #4: team size left unset until confirmed
    maxTeamSize: null,
    operatorCount: 1, // Exactly one operator on the track
    participantRequirements: 'Exactly one designated operator controls the vehicle on the course.',
    requiresPayment: true,
    requiresSubmission: false,
    requiresJudging: true,
    resultsPublished: false,
    featured: true,
    specialNotice: 'The actual track, route, and obstacle arrangement is intentionally not disclosed beforehand.',
    rulesSections: [
      {
        title: 'Vehicle Specifications',
        rules: [
          'Maximum dimensions: Length 30 cm, Width 25 cm, Height 20 cm.',
          'Maximum weight: 5.0 kg.',
          'Control: Remote controlled by one designated operator.',
          'Drive: Wheeled or tracked mechanism allowed.',
        ],
      },
      {
        title: 'Run Rules & Course Conditions',
        rules: [
          'Exactly one operator is permitted inside the driver box during a run.',
          'Actual track, route, incline gradients, and obstacle arrangement are intentionally not disclosed beforehand.',
          'Penalties apply for hand touches or course dislodgement.',
          'Multiple heats with cumulative or best-time scoring criteria.',
        ],
      },
    ],
    faqs: [
      {
        question: 'How many operators run the vehicle?',
        answer: 'Exactly one operator controls the robot during the time trial.',
      },
      {
        question: 'What is the registration fee?',
        answer: '₹699 per team.',
      },
      {
        question: 'Will track blueprints be released prior to race day?',
        answer: 'No. The track layout is strictly undisclosed prior to competition to test real-time handling.',
      },
    ],
  },
  {
    id: 'aurix-robo-expo',
    title: 'AURIX Robo Expo',
    shortName: 'Robo Expo',
    slug: 'robo-expo',
    edition: '2026',
    series: 'AURIX',
    eventType: 'ROBO_EXPO',
    status: 'REGISTRATION_OPEN',
    description:
      'Premier robotics and embedded technology exhibition showcasing working hardware prototypes, research machines, and cyber-physical systems before a distinguished academic and industry jury.',
    shortDescription:
      '₹500 per team. 1–4 participants. Project exhibition with comprehensive 100-mark judging rubrics.',
    startDate: '2026-10-29T10:00:00+05:30',
    endDate: '2026-10-30T17:00:00+05:30',
    registrationOpen: '2026-09-01T00:00:00+05:30',
    registrationClose: '2026-10-25T23:59:59+05:30',
    timezone: 'Asia/Kolkata',
    venue: 'IILM University, Greater Noida',
    location: 'Greater Noida, Uttar Pradesh, India',
    registrationFee: 500,
    currency: 'INR',
    minTeamSize: 1,
    maxTeamSize: 4,
    participantRequirements: 'Teams of 1 to 4 participants. Working hardware demonstration strongly expected.',
    requiresPayment: true,
    requiresSubmission: true,
    requiresJudging: true,
    resultsPublished: false,
    featured: true,
    judgingCriteria: [
      { id: 'crit-1', name: 'Innovation & Originality', description: 'Novelty of approach, patent potential, and creative engineering.', maxScore: 20 },
      { id: 'crit-2', name: 'Technical Complexity', description: 'Depth of circuitry, algorithmic rigor, and integration complexity.', maxScore: 20 },
      { id: 'crit-3', name: 'Working Demonstration', description: 'Live operational demonstration, reliability, and functional robustness.', maxScore: 20 },
      { id: 'crit-4', name: 'Problem Statement & Relevance', description: 'Clarity of the targeted problem and real-world need.', maxScore: 15 },
      { id: 'crit-5', name: 'Engineering Design & Implementation', description: 'Mechanical elegance, PCB layout, wiring quality, and chassis structure.', maxScore: 10 },
      { id: 'crit-6', name: 'Presentation & Explanation', description: 'Oral technical defense and clarity answering judge inquiries.', maxScore: 10 },
      { id: 'crit-7', name: 'Future Scope / Scalability', description: 'Commercialization feasibility, manufacturing pathway, and extensions.', maxScore: 5 },
    ],
    rulesSections: [
      {
        title: 'Project Eligibility',
        rules: [
          'Any original student hardware project in robotics, automation, drones, IoT, or mechatronics.',
          'Teams consist of 1 to 4 participants.',
          'A functional working demonstration is strongly expected during judging.',
        ],
      },
      {
        title: 'Evaluation Framework',
        rules: [
          'Evaluated out of 100 total marks across 7 structured criteria.',
          'Judges conduct booth visits and interactive live interrogations.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is the team size for Robo Expo?',
        answer: '1 to 4 participants per team.',
      },
      {
        question: 'Is a live physical demo mandatory?',
        answer: 'A working physical demonstration is strongly expected and carries 20 marks in the scoring rubric.',
      },
      {
        question: 'What is the registration fee?',
        answer: '₹500 per team.',
      },
    ],
  },
  {
    id: 'aurix-robo-ideathon',
    title: 'AURIX Robo Ideathon 2026',
    shortName: 'Robo Ideathon',
    slug: 'robo-ideathon',
    edition: '2026',
    series: 'AURIX',
    eventType: 'ROBO_IDEATHON',
    status: 'REGISTRATION_OPEN',
    description:
      'A structured ideation and architectural design competition challenging multidisciplinary teams to solve pressing global challenges using robotics, electronics, software, and AI. Physical hardware is optional.',
    shortDescription:
      '₹499 per team. Up to 5 participants. 6-stage ideation flow. Physical hardware optional.',
    startDate: '2026-10-29T10:00:00+05:30',
    endDate: '2026-10-30T16:00:00+05:30',
    registrationOpen: '2026-09-01T00:00:00+05:30',
    registrationClose: '2026-10-25T23:59:59+05:30',
    timezone: 'Asia/Kolkata',
    venue: 'IILM University, Greater Noida',
    location: 'Greater Noida, Uttar Pradesh, India',
    registrationFee: 499,
    currency: 'INR',
    minTeamSize: 1,
    maxTeamSize: 5,
    participantRequirements: 'Teams of up to 5 members. Open to all engineering and science undergraduates.',
    requiresPayment: true,
    requiresSubmission: true,
    requiresJudging: true,
    resultsPublished: false,
    featured: true,
    specialNotice: 'Physical hardware is optional. Evaluation focuses on solution rigor, feasibility, and impact.',
    judgingCriteria: [
      { id: 'crit-i1', name: 'Problem Understanding & Research', description: 'Depth of context, domain data, and user empathy.', weightPercent: 20, maxScore: 20 },
      { id: 'crit-i2', name: 'Innovation & Creativity', description: 'Uniqueness of the robotic or cybernetic concept.', weightPercent: 20, maxScore: 20 },
      { id: 'crit-i3', name: 'Solution Design & Technical Approach', description: 'Feasibility of schematics, software stack, and architecture.', weightPercent: 20, maxScore: 20 },
      { id: 'crit-i4', name: 'Feasibility & Scalability', description: 'Unit economics, component availability, and engineering realism.', weightPercent: 15, maxScore: 15 },
      { id: 'crit-i5', name: 'Real-World Impact', description: 'Measurable social, environmental, or economic value.', weightPercent: 15, maxScore: 15 },
      { id: 'crit-i6', name: 'Pitch & Presentation', description: 'Clarity, persuasiveness, and handling of technical counter-arguments.', weightPercent: 10, maxScore: 10 },
    ],
    rulesSections: [
      {
        title: 'Six-Stage Ideation Process',
        rules: [
          'Problem Revealed: Challenge theme and problem statements unveiled.',
          'Research: Literature study and domain discovery.',
          'Ideate: Brainstorming cyber-physical architectures.',
          'Design: System block diagrams, circuit schematics, and mechanical concepts.',
          'Validate: Mathematical modeling, simulation, and feasibility checks.',
          'Pitch: Final structured presentation before the panel.',
        ],
      },
      {
        title: 'Core Themes',
        rules: [
          'Robotics for Human Life',
          'Robotics for a Sustainable Future',
          'Robotics for Smart Industry & Infrastructure',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do we need to build physical hardware for the Ideathon?',
        answer: 'No. Physical hardware is optional. You may present simulations, CAD designs, block diagrams, or proof-of-concept software.',
      },
      {
        question: 'What is the maximum team size?',
        answer: 'Maximum 5 members per team.',
      },
      {
        question: 'What is the registration fee?',
        answer: '₹499 per team.',
      },
    ],
  },
]
