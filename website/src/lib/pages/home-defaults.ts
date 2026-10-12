/** Starting content of the KRS home sections (new sections in the CMS and the built-in home page). Edited in the CMS. */

export const ORBIT_CARDS = [
  { icon: 'bot', title: 'Autonomous Bots', text: 'Self-navigating systems' },
  { icon: 'code', title: 'Embedded Systems', text: 'Real-time firmware' },
  { icon: 'trophy', title: 'AURIX Challenge', text: 'Compete. Win. Repeat.' },
  { icon: 'cpu', title: 'AI & Vision', text: 'Computer perception' },
]

export const PILLARS = [
  { icon: 'terminal', title: 'Applied Engineering Labs', text: 'Hands-on hardware workbench equipped for rapid prototyping, microcontroller programming, and component assembly.' },
  { icon: 'trophy', title: 'National Competition Circuit', text: 'Representing university excellence across elite robotics challenges, rover competitions, and AI hackathons nationwide.' },
  { icon: 'book-open', title: 'Peer-to-Peer Technical Pedagogy', text: 'Structured workshop bootcamps and open technical roadmaps taking members from fundamentals to advanced ROS2 workflows.' },
  { icon: 'layers', title: 'Industry & Research Synergy', text: 'Collaboration with technical mentors, faculty advisors, and domain specialists on production-grade prototypes.' },
]

export const DISCIPLINE_CARDS = [
  {
    title: 'The Hardware Builders',
    caption: "You keep tinkering with electronics. But nobody's given you access to a dedicated lab workbench until now.",
    backTitle: '01 // Prototyping Laboratory',
    backText: 'Component assembly, PCB design, and hardware debugging.',
    specs: [{ item: 'Custom PCB Design & EDA' }, { item: 'Embedded Systems & Firmware' }, { item: 'Additive Manufacturing & 3D Prototyping' }],
    linkLabel: 'Explore Projects',
    linkHref: '/projects',
  },
  {
    title: 'The Arena Competitors',
    caption: "You know competitions are where reputations are made. You're looking for a crew to build winning robots with.",
    backTitle: '02 // Competition Circuit',
    backText: 'Robot design, driving and pitching at AURIX and beyond.',
    specs: [{ item: 'AURIX Robo Soccer' }, { item: 'AURIX Robo Race' }, { item: 'AURIX Robo Expo' }, { item: 'Robotics & AI Hackathon' }],
    linkLabel: 'Enter AURIX Arena',
    linkHref: '/aurix',
  },
  {
    title: 'The Systems Architects',
    caption: "You've spent years writing code. Now you want to see your algorithms control physical machines in real time.",
    backTitle: '03 // Cyber-Physical Stack',
    backText: 'Robot software, perception and autonomy.',
    specs: [{ item: 'Industrial Automation & ROS2' }, { item: 'Edge AI & Computer Vision' }, { item: 'Control Systems & Kinematics' }],
    linkLabel: 'Read Insights',
    linkHref: '/insights',
  },
]

export const FLAGSHIP_BULLETS = [
  { item: 'Compete in Robo Soccer, Robo Race, Robo Expo and Robo Ideathon' },
  { item: 'Robotics & AI Hackathon with an online first round' },
  { item: '{prizePool} total prize pool' },
]
