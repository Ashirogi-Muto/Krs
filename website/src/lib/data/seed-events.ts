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
    // Source: AURIX_RoboSoccer_2_Page_Brochure.docx
    description:
      "Build and control a team of robots that can dribble, pass and shoot a ball into the opponent's goal on a marked field, while defending your own. The event tests mechanical design, ball-handling ability, driving skill and on-field strategy under a live match clock.",
    shortDescription:
      '₹699 per team. Teams of 1–3 members. Wireless robots, max 30 × 30 × 25 cm and 5 kg.',
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
    participantRequirements:
      'Teams of 1–3 members. Each participant must carry a valid institutional ID. Teams must report at least 30 minutes before their scheduled match slot.',
    requiresPayment: true,
    requiresSubmission: false,
    requiresJudging: true,
    resultsPublished: false,
    featured: true,
    mediaGalleryUrl: 'https://drive.google.com/drive/folders/1-q426Z-Jg61gmAh5BOufhORnx-S3Yu0h',
    specialNotice:
      'Pitch layout, mini-goals, final-round obstacles and other event details may be announced or modified on the event day. Bonus scoring zones may be introduced during the final round.',
    rulesSections: [
      {
        title: 'General Rules',
        rules: [
          'Team size: 1–3 members per team.',
          'Each participant must carry a valid institutional ID.',
          'Registration is confirmed only after successful form submission; teams must report according to the organizer schedule. Late reporting may lead to forfeiture of the match.',
          'Robots must comply with the specified technical requirements and must not intentionally damage the pitch, goal posts or the opposing robot.',
          'Unsafe, unsportsmanlike or unethical play, deliberate obstruction, or unauthorized external assistance may lead to a yellow/red card or disqualification.',
          "Referee and judges' decisions are final. Pitch layout and match rules may change according to event requirements.",
          'Certificates will be awarded to all eligible participants.',
        ],
      },
      {
        title: 'Robot Specifications',
        rules: [
          'Maximum dimensions: 30 × 30 × 25 cm (L × B × H) per robot.',
          'Maximum weight: 5 kg per robot (5% allowance).',
          'Robots must be wireless / remote-controlled — no wired tethers permitted on the pitch.',
          'A team may use up to two controllers, one per active robot.',
          'Any mechanism used to strike, carry or trap the ball must be non-detachable and must not entrap or damage the ball.',
          'Ready-made toy cars and ready-made kits are prohibited.',
          'Pneumatic/hydraulic systems, IC engines and any mechanism designed to damage the opposing robot are strictly prohibited.',
        ],
      },
      {
        title: 'Match Format',
        rules: [
          'League stage: round-robin, 3-minute matches. 3 points for a win, 1 for a draw, 0 for a loss.',
          'Quarter / semi-final: knockout, 4-minute matches. Extra time on a tie, followed by a penalty shoot-out.',
          'Final: 5-minute knockout match.',
        ],
      },
      {
        title: 'Scoring & Fouls',
        rules: [
          'A goal is scored when the entire ball crosses the goal line between the posts.',
          'Pushing, ramming or deliberately flipping an opposing robot: yellow card (first offence), red card (repeat offence).',
          'Ball held/trapped for more than 5 seconds without advancing: possession awarded to the opposing team.',
          'Robot leaving the pitch boundary: 5-second time-out before it may re-enter play.',
          'A red card removes the robot from the remainder of the match; the team continues with one robot short.',
        ],
      },
      {
        title: 'Winning Criteria',
        rules: [
          'The team with the higher score at the end of regulation time wins the match.',
          'League standings are decided by points, then goal difference, then head-to-head result.',
        ],
      },
      {
        title: 'Prizes & Awards',
        rules: [
          'Winner Team: Trophy + Certificate + Cash Prize.',
          'Runner-up Team: Trophy + Certificate + Cash Prize.',
          'Certificates of participation for all registered teams.',
        ],
      },
      {
        title: 'Coordination',
        rules: ['Faculty Coordinator: Dr. Vanya Arun.'],
      },
    ],
    faqs: [
      {
        question: 'What is the team size for Robo Soccer?',
        answer: '1 to 3 members per team.',
      },
      {
        question: 'Can the robot be wired?',
        answer: 'No. Robots must be wireless / remote-controlled — no wired tethers are permitted on the pitch.',
      },
      {
        question: 'How long are matches?',
        answer: 'League matches are 3 minutes, quarter and semi-finals 4 minutes, and the final 5 minutes.',
      },
      {
        question: 'Can we know the pitch layout in advance?',
        answer: 'Pitch layout, mini-goals and final-round obstacles may be announced or modified on the event day.',
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
    // Source: AURIX_RoboRace_2_Page_Brochure.docx
    description:
      'Design and operate a manually controlled robot to complete the designated track in minimum time while overcoming obstacles. The competition tests speed, control, power, precision and obstacle-handling ability.',
    shortDescription:
      '₹699 per team. Teams of 1–3 members. Manually controlled, max 30 × 30 × 20 cm and 5 kg.',
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
    operatorCount: 1, // Kept separate from team size per SPEC; not restated in the brochure
    participantRequirements:
      'Teams of 1–3 members; cross-institution teams are allowed. Each participant must carry a valid institutional ID.',
    requiresPayment: true,
    requiresSubmission: false,
    requiresJudging: true,
    resultsPublished: false,
    featured: true,
    specialNotice:
      'Track configuration, obstacles and final-round challenges may be announced or modified on the event day. Bonus opportunities may also be introduced during the race.',
    rulesSections: [
      {
        title: 'General Rules',
        rules: [
          'Team size: 1–3 members per team; cross-institution teams are allowed.',
          'Each participant must carry a valid institutional ID.',
          'Registration is confirmed only after successful form submission; teams must report according to the organizer schedule. Late reporting may lead to disqualification.',
          'Robots must comply with the specified technical requirements and must not intentionally damage the track, arena or obstacles or leave parts behind.',
          'Unethical, unsafe or unsportsmanlike behaviour, deliberate obstacle bypassing, intentional interference, or unauthorized external assistance may lead to penalty/disqualification.',
          "Organizers' and judges' decisions are final. Rules, track configuration and challenges may change according to event requirements.",
          'Certificates will be awarded to all eligible participants.',
        ],
      },
      {
        title: 'Robot Specifications',
        rules: [
          'Maximum dimensions: 30 × 30 × 20 cm (L × B × H).',
          'Maximum weight: 5 kg (5% allowance).',
          'Robot may be wired or wireless. Wired robots must have sufficient wire length to cover the full track with adequate slack.',
          'Robot must remain within the specified dimensions throughout the competition.',
          'Robot must be manually controlled.',
          'Ready-made toy cars and ready-made kits are prohibited.',
          'Pneumatic/hydraulic systems and IC engines are prohibited.',
        ],
      },
      {
        title: 'Rounds',
        rules: [
          'Round 1 — Elimination: time-based run on the designated Robo Race track.',
          'Round 2 — Qualifier: time-based run on the designated track with penalties for human intervention.',
          'Final Round: finalists compete on the designated track with additional challenges/obstacles revealed in the Final Round.',
        ],
      },
      {
        title: 'Event Phases & Penalties',
        rules: [
          'Competition follows a time-trial system, with an elimination round for each team.',
          'Top-performing teams from the qualifier advance to the final based on time and minimum human intervention.',
          'Hand touches are allowed in the qualifier: +10 seconds per touch.',
          'False start: counter reset; second false start = disqualification.',
          'Robot off-course: +5 seconds each time.',
        ],
      },
      {
        title: 'Winning Criteria',
        rules: [
          'The team completing the designated track in the minimum adjusted time, after applicable penalties, will be ranked highest.',
        ],
      },
      {
        title: 'Coordination',
        rules: ['Faculty Coordinator: Dr. Vanya Arun.'],
      },
    ],
    faqs: [
      {
        question: 'What is the team size for Robo Race?',
        answer: '1 to 3 members per team. Cross-institution teams are allowed.',
      },
      {
        question: 'Can the robot be wired?',
        answer: 'Yes. Robots may be wired or wireless; wired robots need enough wire to cover the full track with slack.',
      },
      {
        question: 'How are penalties applied?',
        answer: '+10 seconds per hand touch in the qualifier, +5 seconds each time the robot goes off-course, and a second false start means disqualification.',
      },
      {
        question: 'Will the track be released before race day?',
        answer: 'Track configuration, obstacles and final-round challenges may be announced or modified on the event day.',
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
    // Source: AURIX_ROBO_EXPO_RULEBOOK_JUSTIFIED_3_PAGES.docx
    description:
      'Turn ideas into machines. ROBO EXPO challenges college teams to present a unique robotics project, demonstrate how it works, defend their technical choices and show its real-world potential.',
    shortDescription:
      '₹500 per team. Teams of 2–4 members. Present, demo and defend your robot — judged out of 100.',
    startDate: '2026-10-29T10:00:00+05:30',
    endDate: '2026-10-30T17:00:00+05:30',
    registrationOpen: '2026-09-01T00:00:00+05:30',
    registrationClose: '2026-10-25T23:59:59+05:30',
    timezone: 'Asia/Kolkata',
    venue: 'IILM University, Greater Noida',
    location: 'Greater Noida, Uttar Pradesh, India',
    registrationFee: 500,
    currency: 'INR',
    minTeamSize: 2,
    maxTeamSize: 4,
    participantRequirements:
      'Teams of 2–4 members. One student can participate in only one team. Teams must report at least 30 minutes before their scheduled slot.',
    requiresPayment: true,
    requiresSubmission: true,
    requiresJudging: true,
    resultsPublished: false,
    featured: true,
    judgingCriteria: [
      { id: 'crit-1', name: 'Innovation & Creativity', description: 'Originality, creativity and a distinctive approach.', maxScore: 20 },
      { id: 'crit-2', name: 'Working / Functionality', description: 'How reliably and successfully the robot performs its intended task.', maxScore: 25 },
      { id: 'crit-3', name: 'Technical Implementation', description: 'Quality of hardware, software, circuit design and engineering decisions.', maxScore: 20 },
      { id: 'crit-4', name: 'Real-world Application', description: 'Practical usefulness, relevance and potential application.', maxScore: 15 },
      { id: 'crit-5', name: 'Design & Build Quality', description: 'Construction, neatness, integration and overall design quality.', maxScore: 10 },
      { id: 'crit-6', name: 'Presentation & Explanation', description: 'Clarity, confidence and ability to explain technical choices.', maxScore: 10 },
    ],
    rulesSections: [
      {
        title: 'General Rules',
        rules: [
          'Team formation: each team can have 2–4 members.',
          'One-team rule: one student can participate in only one team.',
          'Registration: teams must register before the specified deadline.',
          'Unique project: each team must have a unique project/robot.',
          'Fair play & originality: teams must be able to explain their own circuit, code, design and working.',
          "Purchased parts: purchased modules/components are allowed, but another person's work cannot be claimed as the team's own.",
          "Copying another team's project without substantial modification can result in disqualification.",
          "Judges' scoring decisions are final.",
        ],
      },
      {
        title: 'Robot Requirements',
        rules: [
          'Robots may be autonomous, manually controlled or semi-autonomous.',
          'Arduino, ESP32, Raspberry Pi, STM32 or other suitable controllers may be used.',
          'Homemade and commercially available components are allowed; pre-built kits may be used with team modifications/features.',
          'The robot should be designed/built by the participating team. Fire, explosives, weapons and dangerous high-voltage systems are prohibited.',
        ],
      },
      {
        title: 'Presentation Structure (approx. 5–7 minutes)',
        rules: [
          'Problem Statement — the real problem the project is intended to solve.',
          'Idea & Working — the concept, workflow and operating principle.',
          'Hardware & Software — major hardware, sensors, controllers, circuits and software used.',
          'Innovation — what is new, improved or distinctive.',
          'Real-World Application — where and how the project could be practically used.',
          'Future Improvements — realistic upgrades or next steps.',
          "Live Demonstration — demonstrate the robot's actual working.",
        ],
      },
      {
        title: 'Time Rules',
        rules: [
          'Setup — 5 minutes: prepare the robot, power, laptop and demonstration area.',
          'Presentation — 5 minutes: explain the problem, idea, implementation and innovation.',
          'Demonstration — 3 minutes: show the robot performing its intended function.',
          "Q&A — 2 minutes: answer judges' technical questions.",
          'The exact sequence/timing may be adjusted by organizers depending on the number of participating teams.',
        ],
      },
      {
        title: 'Safety Rules',
        rules: [
          'Maximum battery voltage must follow the limit specified by organizers.',
          'Batteries must be securely mounted and properly insulated.',
          'No exposed dangerous wiring is permitted.',
          'No flame-based mechanism unless specifically approved.',
          'Projects must not intentionally damage another robot or venue equipment.',
          'Organizers may stop any demonstration considered unsafe.',
        ],
      },
      {
        title: 'Disqualification',
        rules: [
          'Misconduct or cheating, including deliberate attempts to manipulate the competition.',
          "Deliberate damage to another team's project or venue equipment.",
          'Using components or systems prohibited by the event safety rules.',
          "Plagiarism or falsely presenting someone else's work as the team's own.",
          'Continuing unsafe operation after being warned by organizers.',
          'Exceeding the permitted setup/demo area or violating registration/team-size rules.',
        ],
      },
      {
        title: 'Prizes & Awards',
        rules: [
          'Winner Team: Trophy + Certificate + Cash Prize.',
          'Runner-up Team: Trophy + Certificate + Cash Prize.',
          'Certificates of participation for all registered teams.',
        ],
      },
    ],
    faqs: [
      {
        question: 'What is the team size for Robo Expo?',
        answer: '2 to 4 members per team, and one student can be in only one team.',
      },
      {
        question: 'Is a live demonstration required?',
        answer: 'Yes. Each team gets a 3-minute demonstration slot, and Working / Functionality carries 25 of the 100 marks.',
      },
      {
        question: 'Can we use pre-built kits?',
        answer: 'Pre-built kits may be used with team modifications/features, but the team must be able to explain its own circuit, code, design and working.',
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
    // Source: AURIX_2026_Robo_Ideathon_Brief (1).docx
    description:
      'Robotics & electronics for real-world impact. A problem-solving and innovation challenge where teams develop robotics, electronics, software, AI, IoT, or hybrid solutions for real-world problems. The challenge is revealed in advance so teams can research, ideate, design, validate, and pitch their solution.',
    shortDescription:
      '₹499 per team. Up to 5 members. Not a robot-building competition — physical hardware is optional.',
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
    participantRequirements:
      'Maximum 5 members per team. Recommended roles: Research, Ideation, Design (CAD), Electronics, Programming, AI/ML, UI/UX, Pitching, Documentation.',
    requiresPayment: true,
    requiresSubmission: true,
    requiresJudging: true,
    resultsPublished: false,
    featured: true,
    specialNotice:
      "Not a robot-building competition: physical hardware is optional. \"You don't need the biggest robot. You need the smartest solution.\"",
    judgingCriteria: [
      { id: 'crit-i1', name: 'Problem Understanding & Research', description: 'Clear problem understanding and robust background research.', weightPercent: 20, maxScore: 20 },
      { id: 'crit-i2', name: 'Innovation & Creativity', description: 'Originality and creative leap in ideation.', weightPercent: 20, maxScore: 20 },
      { id: 'crit-i3', name: 'Solution Design & Technical Approach', description: 'Strong technical approach and sound architectural design.', weightPercent: 20, maxScore: 20 },
      { id: 'crit-i4', name: 'Feasibility & Scalability', description: 'Practical feasibility, scalability, and economic viability.', weightPercent: 15, maxScore: 15 },
      { id: 'crit-i5', name: 'Real-World Impact', description: 'Real-world impact and measurable benefits.', weightPercent: 15, maxScore: 15 },
      { id: 'crit-i6', name: 'Pitch & Presentation', description: 'Clear and convincing pitch presentation.', weightPercent: 10, maxScore: 10 },
    ],
    rulesSections: [
      {
        title: 'Ideathon Progression Flow',
        rules: ['1. Problem Revealed', '2. Research', '3. Ideate', '4. Design', '5. Validate & Pitch'],
      },
      {
        title: 'What Teams Can Present',
        rules: [
          'Hardware, software, IoT/electronics, AI/ML, robotics, hybrid systems, CAD, simulation, or proof of concept. Physical hardware is not mandatory.',
          'Demonstrate ideas through evidence: UI, simulation, CAD, architecture, algorithms, data, or concept validation.',
        ],
      },
      {
        title: 'Challenge Themes',
        rules: [
          '01 · Robotics for Human Life — Healthcare & Assistive Tech, Disaster Management & Rescue, Home Automation, Public Safety, Accessibility.',
          '02 · Robotics for a Sustainable Future — Smart Agriculture, Waste Management, Environmental Monitoring, Water Management, Renewable Energy.',
          '03 · Robotics for Smart Industry & Infrastructure — Industrial Automation, Logistics & Warehousing, Smart Cities, Traffic Infrastructure, Construction Engineering.',
        ],
      },
      {
        title: 'PPT / Pitch Structure',
        rules: [
          '1. Problem & Research',
          '2. Problem Gap',
          '3. Proposed Solution',
          '4. How It Works',
          '5. Technology',
          '6. Innovation',
          '7. Validation / Proof of Concept',
          '8. Feasibility',
          '9. Impact',
          '10. Future Scope',
        ],
      },
    ],
    faqs: [
      {
        question: 'Do we need to build physical hardware for the Ideathon?',
        answer: 'No. Physical hardware is optional — the core focus is on the ingenuity and quality of the solution. You may present simulations, CAD, architecture, algorithms, data or a proof of concept.',
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
