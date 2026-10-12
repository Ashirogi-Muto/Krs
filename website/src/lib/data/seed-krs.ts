import { ProjectItem, LearningResource, BlogPost, TeamMemberProfile } from './types'

export const KRS_GENERAL_INFO = {
  name: 'Kalam Robotics Society',
  shortName: 'KRS',
  institution: 'IILM University, Greater Noida',
  location: 'Knowledge Park II, Greater Noida, Uttar Pradesh, India',
  motto: 'LEARN. BUILD. COMPETE. INNOVATE.',
  about:
    'Kalam Robotics Society (KRS) is the premier multidisciplinary student robotics and cyber-physical systems laboratory at IILM University, Greater Noida. Founded to foster advanced hands-on experimentation, applied research, and national competitive excellence, KRS empowers aspiring engineers across mechanical, electronic, and software domains.',
  domains: [
    'Autonomous Robotics',
    'Edge AI & Computer Vision',
    'Internet of Things (IoT)',
    'Unmanned Aerial Vehicles (Drones)',
    'Embedded Systems & Firmware',
    'Custom PCB Design & EDA',
    'Industrial Automation & ROS2',
    'Additive Manufacturing & 3D Prototyping',
    'Control Systems & Kinematics',
  ],
  pillars: [
    {
      title: 'Applied Engineering Labs',
      description: 'Hands-on hardware workbench equipped for rapid prototyping, microcontroller programming, and component assembly.',
    },
    {
      title: 'National Competition Circuit',
      description: 'Representing university excellence across elite robotics challenges, rover competitions, and AI hackathons nationwide.',
    },
    {
      title: 'Peer-to-Peer Technical Pedagogy',
      description: 'Structured workshop bootcamps and open technical roadmaps taking members from fundamentals to advanced ROS2 workflows.',
    },
    {
      title: 'Industry & Research Synergy',
      description: 'Collaboration with technical mentors, faculty advisors, and domain specialists on production-grade prototypes.',
    },
  ],
}

export const SEED_PROJECTS: ProjectItem[] = [
  {
    id: 'project-yuvaan',
    title: 'YUVAAN Semi-Autonomous Rover',
    slug: 'yuvaan',
    shortDescription:
      'A multi-terrain research and planetary exploration rover platform featuring custom suspension kinematics, stereoscopic vision, and ROS2 navigation.',
    description:
      'YUVAAN represents the flagship robotics project of the Kalam Robotics Society. Designed and fabricated in-house at IILM University, the rover integrates a rock-bogie-inspired mobility chassis with a sensor fusion perception stack for semi-autonomous terrain traversal and hazard avoidance.',
    status: 'IN_PROGRESS',
    year: 2026,
    domains: ['Autonomous Robotics', 'Computer Vision', 'Embedded Systems', 'ROS2'],
    technologies: ['ROS2 Humble', 'Python', 'C++', 'Nav2', 'Stereo Depth Cameras', 'STM32', 'Custom 4-Layer PCB'],
    featured: true,
    hardwareSpecs: [
      'High-torque planetary gear motors with optical quadrature encoders',
      'Dual stereoscopic depth cameras for real-time visual odometry',
      'Custom power distribution PCB with dual-rail voltage regulation and telemetry',
      'Solid-state IMU with Kalman filter fusion for pitch/roll compensation',
    ],
    softwareSpecs: [
      'ROS2 Humble architecture with distributed node topology',
      'Nav2 2D/3D costmap generation and dynamic obstacle avoidance',
      'Low-latency WebRTC teleoperation control panel',
      'Real-time edge object detection pipeline running on onboard accelerator',
    ],
    results:
      'Successfully demonstrated waypoint navigation, autonomous obstacle avoidance in unstructured environments, and 45-minute continuous mission endurance.',
    demoUrl: 'https://drive.google.com/file/d/1r5rKUX6gWxMVRjp5J95fIx2z4eJ0jB_q/view?usp=drivesdk',
    videoUrl: 'https://drive.google.com/file/d/1r5rKUX6gWxMVRjp5J95fIx2z4eJ0jB_q/view?usp=drivesdk',
    driveUrl: 'https://drive.google.com/drive/folders/144vtl7deSoZVAXahZVVJ3mtEGDgLXdTS',
  },
  {
    id: 'project-agri-bot',
    title: 'Precision Agri-Sensing Rover',
    slug: 'agri-sensing-rover',
    shortDescription:
      'An IoT-connected autonomous rover for real-time soil chemistry telemetry, plant health spectral indexing, and micro-irrigation management.',
    description:
      'Developed to address precision agriculture challenges in North India, this wheeled rover traverses crop rows while collecting multi-depth soil moisture data, NPK chemical indicators, and canopy health imagery.',
    status: 'COMPLETED',
    year: 2025,
    domains: ['Internet of Things (IoT)', 'Autonomous Robotics', 'Smart Agriculture'],
    technologies: ['ESP32', 'LoRaWAN', 'Multispectral Camera', 'MQTT', 'Next.js Dashboard'],
    featured: false,
    hardwareSpecs: ['Modular soil probe insertion actuator', 'LoRaWAN 868MHz transceiver for long-range telemetry', 'Solar top-up charging panel'],
    softwareSpecs: ['Edge NDVI spectral calculation', 'Low-power sleep state management', 'Cloud telemetry pipeline'],
    results: 'Demonstrated over 5 km² coverage area with reliable remote sensor transmission.',
  },
  {
    id: 'project-hexapod',
    title: 'Kinematic Hexapod Explorer',
    slug: 'hexapod-explorer',
    shortDescription:
      'An 18-DOF biomimetic hexapod walking robot designed for pipeline inspection and rubble navigation.',
    description:
      'A biologically inspired multi-legged robotic platform engineered to navigate stairs, pipes, and debris where wheeled rovers fail.',
    status: 'COMPLETED',
    year: 2025,
    domains: ['Kinematics', 'Embedded Systems', 'Robotics'],
    technologies: ['Inverse Kinematics', 'STM32F4', 'Metal Gear Servos', 'IMU Fusion'],
    featured: false,
    hardwareSpecs: ['18 high-torque metal-gear digital servos', 'Laser-cut aircraft-grade acrylic and aluminum frame', 'Current sensing power board'],
    softwareSpecs: ['Trigonometric inverse kinematics solver', 'Tripod and wave gait algorithms', 'Auto-leveling terrain adaptation'],
    results: 'Traversed 35-degree uneven gravel inclines with zero tip-over incidents.',
  },
]

export const SEED_LEARNING_RESOURCES: LearningResource[] = [
  {
    id: 'learn-ros2-fundamentals',
    title: 'ROS2 Humble Fundamentals: Nodes, Topics, and Actions',
    slug: 'ros2-fundamentals',
    category: 'ROS / ROS2',
    difficulty: 'INTERMEDIATE',
    estimatedTime: '45 mins',
    resourceType: 'ARTICLE',
    summary:
      'An architectural guide to understanding the Robot Operating System (ROS2) DDS middleware, publisher-subscriber communication, and action servers.',
    content: `
# ROS2 Architecture Overview

The Robot Operating System (ROS2) has emerged as the global industry benchmark for cyber-physical robotics software. Unlike ROS1 which relied on a centralized roscore master, ROS2 is engineered upon the Object Management Group Data Distribution Service (OMG DDS) standard, providing peer-to-peer discovery, deterministic real-time communication, and strict quality-of-service (QoS) policies.

## 1. Core Abstractions

### Nodes
A Node in ROS2 represents a single, focused process responsible for an atomic robotics task (such as reading an IMU sensor, computing kinematics, or executing motor control loops). Distributed nodes communicate over standardized message structures.

### Topics & QoS
Topics implement asynchronous many-to-many publish-subscribe communication. In mission-critical environments, Quality of Service profiles dictate whether messages prioritize reliability (lossless delivery) or "best effort" low latency (ideal for high-frequency sensor streams like LiDAR and camera feeds).

### Services vs Actions
- **Services**: Synchronous request-response RPC calls designed for brief queries (e.g. toggling a camera or requesting battery status).
- **Actions**: Long-running goal-oriented tasks with periodic progress feedback and cancelability (e.g. instructing a mobile rover to navigate 50 meters to a waypoint).

## 2. Setting Up Your Development Environment
Begin by creating a clean ROS2 workspace using colcon build tooling:
\`\`\`bash
mkdir -p ~/krs_ws/src
cd ~/krs_ws
colcon build --symlink-install
source install/setup.bash
\`\`\`
    `,
    author: 'KRS Technical Core',
    tags: ['ROS2', 'Robotics', 'Linux', 'Software Architecture'],
    publishedAt: '2026-08-15T10:00:00+05:30',
  },
  {
    id: 'learn-esp32-embedded',
    title: 'ESP32 Motor Control: PWM Generation & Optical Encoders',
    slug: 'esp32-motor-control',
    category: 'ESP32',
    difficulty: 'BEGINNER',
    estimatedTime: '30 mins',
    resourceType: 'TUTORIAL',
    summary:
      'Learn how to configure the ESP32 MCPWM hardware peripheral for bidirectional H-bridge motor driving and attach hardware interrupts for precise wheel odometry.',
    content: `
# ESP32 Closed-Loop Motor Control

Precision robotic navigation begins at the actuator boundary. While open-loop PWM control commands power to a DC motor, friction and voltage fluctuations cause severe drift. Closed-loop PID velocity control using optical quadrature encoders is essential.

## 1. Hardware Pinout & Wiring
- Connect ESP32 GPIO 18 & 19 to your motor driver PWM inputs.
- Connect Encoder Channel A and B to GPIO 34 & 35 with pull-up resistors.
- Ensure common ground between the microcontroller logic and motor power rails.

## 2. Interrupt-Driven Odometry Tracking
Using dedicated hardware interrupts ensures zero pulse drops even under high-RPM operation.
    `,
    author: 'KRS Electronics Team',
    tags: ['ESP32', 'Embedded Systems', 'C++', 'Electronics'],
    publishedAt: '2026-08-20T10:00:00+05:30',
  },
  {
    id: 'learn-pcb-design',
    title: 'KiCad PCB Design: High-Current Traces & Ground Planes',
    slug: 'kicad-pcb-design',
    category: 'PCB Design',
    difficulty: 'INTERMEDIATE',
    estimatedTime: '60 mins',
    resourceType: 'ARTICLE',
    summary:
      'Best practices for designing custom robotics breakout boards in KiCad, including trace width calculation for motor currents, star grounding, and EMI mitigation.',
    content: `
# Engineering Reliable Robotics PCBs

Vibration, sudden current surges, and inductive kickback from motors create harsh operational environments for electronics. Designing dedicated printed circuit boards eliminates unstable breadboard connections.

## Key Design Principles
1. **Trace Width**: Calculate width according to IPC-2152 standards for 1oz and 2oz copper weights to prevent trace heating during motor stalls.
2. **Ground Plane Integrity**: Maintain unbroken ground planes beneath high-frequency signals and keep noisy motor ground returns segregated from analog logic grounds.
3. **Decoupling Capacitors**: Place 100nF ceramic decoupling capacitors immediately adjacent to microcontroller power pins.
    `,
    author: 'KRS Hardware Lab',
    tags: ['KiCad', 'Hardware', 'PCB Design', 'Electronics'],
    publishedAt: '2026-09-01T10:00:00+05:30',
  },
  {
    id: 'learn-arduino-workshop-2026',
    title: 'Arduino Robotics & Microcontrollers: Hands-on Workshop 2026',
    slug: 'arduino-workshop-2026',
    category: 'Arduino & Embedded',
    difficulty: 'BEGINNER',
    estimatedTime: '90 mins',
    resourceType: 'TUTORIAL',
    summary:
      'Curriculum slides, circuit schematics, source code repositories, and laboratory archives from the KRS Arduino Hands-on Workshop 2026.',
    content: `
# Arduino Robotics Workshop 2026

The Kalam Robotics Society Arduino Workshop is an intensive, hands-on bootcamp designed to take students from basic electronics and digital I/O to interfacing sensors, actuators, and motor drivers for autonomous robots.

## 1. Core Modules Covered
- **Digital I/O & Analog Signals**: Pulse Width Modulation (PWM), ADC resolution, and pull-up resistor networks.
- **Sensor Interfacing**: Ultrasonic distance sensors (HC-SR04), infrared line tracking arrays, and MPU6050 6-DOF IMUs.
- **Motor Control & Actuation**: Dual H-bridge L298N and TB6612FNG drivers, DC gear motors, and servo positioning.
- **Serial Communication**: UART telemetry, debugging via Serial Monitor, and Bluetooth/RF module integration.

## 2. Lab Resources & Photo Archive
Complete workshop slides, code sketches, and event photos are archived in the KRS Google Drive:
[Access Arduino Workshop 2026 Drive Folder](https://drive.google.com/drive/folders/18BG_Ux6AUhkzdO3hkphNTnHninjbJlpU)
    `,
    author: 'KRS Technical Core & Mentors',
    tags: ['Arduino', 'Robotics', 'Embedded C', 'Sensors', 'Workshops'],
    publishedAt: '2026-08-25T10:00:00+05:30',
    driveUrl: 'https://drive.google.com/drive/folders/18BG_Ux6AUhkzdO3hkphNTnHninjbJlpU',
  },
]

export const SEED_BLOGS: BlogPost[] = [
  {
    id: 'blog-yuvaan-architecture',
    title: 'Building YUVAAN: From Kinematic CAD Models to Field Traversal',
    slug: 'building-yuvaan-kinematics-to-field',
    summary:
      'An engineering deep-dive into the design iterations, suspension geometry, and sensor fusion algorithms powering the KRS flagship rover.',
    content: `
# The YUVAAN Journey

Every robotics society needs a flagship challenge that pushes every engineering discipline to its limits. For Kalam Robotics Society at IILM University, that challenge is **YUVAAN**.

## Suspension & Mechanical Rigor
Conventional four-wheel rigid chassis designs suffer from wheel lifting and loss of traction on uneven terrain. To maintain continuous ground contact and equal load distribution, our mechanical team designed a custom articulated rocker suspension using aircraft-grade aluminum.

## Sensor Fusion & Perception
Perception in outdoor sunlight presents significant challenges for traditional infrared and ultrasonic sensors. YUVAAN utilizes stereoscopic depth cameras paired with an inertial measurement unit (IMU). Using an Extended Kalman Filter (EKF), the onboard system fuses wheel odometry with visual odometry to provide a robust state estimate for autonomous navigation.
    `,
    category: 'Project Stories',
    author: 'YUVAAN Core Engineering Team',
    readingTimeMinutes: 6,
    publishedAt: '2026-09-10T12:00:00+05:30',
    coverImage: '/images/yuvaan-rover.jpg',
    tags: ['Rover', 'Engineering', 'Robotics', 'ROS2'],
  },
  {
    id: 'blog-hackathon-prep',
    title: 'How to Prepare for the KRS Robotics & AI Hackathon 2026',
    slug: 'hackathon-2026-preparation-guide',
    summary:
      'Strategic advice on assembling multidisciplinary teams, planning hardware component kits, and preparing for the 12-hour national challenge.',
    content: `
# Mastering the 12-Hour Build

The KRS Robotics & AI Hackathon 2026 at IILM University Greater Noida brings together shortlisted national teams for a continuous 12-hour sprint. Success requires more than just coding speed—it demands rigorous system architecture.

## 1. Team Balance
With teams of 1 to 5 participants, optimal teams balance mechanical fabrication, embedded firmware, computer vision/AI pipelines, and technical presentation skills.

## 2. Modular Architecture
In a 12-hour sprint, monolithic codebases lead to fatal integration bottlenecks. Establish strict message schemas and API contracts at Hour 2 so mechanical, electrical, and software streams can progress simultaneously.
    `,
    category: 'Competition Debrief',
    author: 'KRS Hackathon Organizing Committee',
    readingTimeMinutes: 5,
    publishedAt: '2026-09-18T14:00:00+05:30',
    coverImage: '/images/flagship-event.jpg',
    tags: ['AURIX', 'Hackathon', 'Competition', 'AI'],
  },
  {
    id: 'blog-edge-ai-perception',
    title: 'Deploying Real-Time Edge Vision & Obstacle Tracking',
    slug: 'deploying-real-time-edge-vision',
    summary:
      'Engineering benchmarks and latency optimization for multi-class obstacle segmentation running on onboard embedded neural accelerators.',
    content: `
# Low-Latency Edge Inferencing

Navigating unstructured environments at high speeds requires ultra-low perception latency. Discover how the KRS software team converted deep neural networks into optimized tensor engine runtimes.
    `,
    category: 'Technical Stack',
    author: 'KRS AI Perception Stack Team',
    readingTimeMinutes: 4,
    publishedAt: '2026-09-24T10:00:00+05:30',
    coverImage: '/images/krs-lab.jpg',
    tags: ['Edge AI', 'Computer Vision', 'YOLO', 'ROS2'],
  },
]

export const SEED_TEAM: TeamMemberProfile[] = [
  {
    id: 'team-fac-coord',
    name: 'Faculty Coordinator',
    role: 'Faculty Advisor & Society Mentor',
    department: 'School of Engineering & Technology',
    teamGroup: 'FACULTY',
    bio: 'Guiding student research, laboratory safety, and academic alignment for robotics and cyber-physical engineering projects at IILM University.',
    active: true,
    startYear: 2024,
  },
  {
    id: 'team-pres',
    name: 'President, Kalam Robotics Society',
    role: 'Society President & Team Lead',
    department: 'Computer Science & Robotics Engineering',
    teamGroup: 'LEADERSHIP',
    bio: 'Overseeing technical projects, AURIX competition architecture, and society initiatives across university engineering cohorts.',
    active: true,
    startYear: 2025,
  },
  {
    id: 'team-tech-lead',
    name: 'Technical Director',
    role: 'Systems Architecture & Firmware Lead',
    department: 'Electronics & Communication Engineering',
    teamGroup: 'ELECTRONICS',
    bio: 'Specializing in embedded Linux, RTOS firmware development, and custom PCB hardware integration.',
    active: true,
    startYear: 2025,
  },
  {
    id: 'team-ai-lead',
    name: 'AI & Perception Lead',
    role: 'Computer Vision & Deep Learning Specialist',
    department: 'Artificial Intelligence & Machine Learning',
    teamGroup: 'SOFTWARE_AI',
    bio: 'Focusing on edge inference, SLAM perception, and sensor fusion for autonomous mobile robotics.',
    active: true,
    startYear: 2025,
  },
]
