/** Gallery categories (CMS select options and the /gallery filter). */
export const GALLERY_CATEGORIES = ['Projects', 'Competitions', 'Workshops', 'Lab Workbench'] as const

/** Gallery albums that used to be written into the page; imported once into the CMS (Gallery albums). */
export interface GalleryItem {
  id: string
  title: string
  category: string
  caption: string
  date: string
  driveUrl: string
  type: 'album' | 'video'
}

export const SEED_GALLERY: GalleryItem[] = [
  {
    id: 'gal-robo-soccer',
    title: 'Robo Soccer Ignite Tournament & Arena Shoot',
    category: 'Competitions',
    caption: 'Official photo and video capture from the Robo Soccer matches during the Ignite tournament showcase.',
    date: 'September 2026',
    driveUrl: 'https://drive.google.com/drive/folders/1-q426Z-Jg61gmAh5BOufhORnx-S3Yu0h',
    type: 'album',
  },
  {
    id: 'gal-yuvaan-shoot',
    title: 'YUVAAN Rover Field Deployment & Studio Shoot',
    category: 'Projects',
    caption: 'High-resolution media demonstrating autonomous obstacle traversal, suspension articulation, and field testing.',
    date: 'September 2026',
    driveUrl: 'https://drive.google.com/drive/folders/1QsGqOYEl74GQf6-7QUabIin1JUmXwNi4',
    type: 'album',
  },
  {
    id: 'gal-yuvaan-video',
    title: 'YUVAAN Autonomous Rover Demonstration (Footage)',
    category: 'Projects',
    caption: 'Video recording (IMG_1550.MOV) capturing waypoint navigation and real-time obstacle avoidance on rough ground.',
    date: 'September 2026',
    driveUrl: 'https://drive.google.com/file/d/1r5rKUX6gWxMVRjp5J95fIx2z4eJ0jB_q/view?usp=drivesdk',
    type: 'video',
  },
  {
    id: 'gal-yuvaan-pics',
    title: 'YUVAAN Complete Prototyping & Fabrication Archives',
    category: 'Projects',
    caption: 'Comprehensive photo archives documenting the mechanical fabrication, rocker-bogie assembly, and custom PCB wiring.',
    date: 'August 2026',
    driveUrl: 'https://drive.google.com/drive/folders/144vtl7deSoZVAXahZVVJ3mtEGDgLXdTS',
    type: 'album',
  },
  {
    id: 'gal-arduino-workshop',
    title: 'Arduino Robotics & Microcontrollers Workshop 2026',
    category: 'Workshops',
    caption: 'Hands-on laboratory training, sensor interfacing, and motor control workshops conducted with student inductees.',
    date: 'August 2026',
    driveUrl: 'https://drive.google.com/drive/folders/18BG_Ux6AUhkzdO3hkphNTnHninjbJlpU',
    type: 'album',
  },
  {
    id: 'gal-lab-workbench',
    title: 'Robotics Laboratory & Hardware Prototyping Sessions',
    category: 'Lab Workbench',
    caption: 'Workbench soldering, oscilloscope sensor diagnostics, 3D printing runs, and firmware flash sessions inside the KRS lab.',
    date: 'July 2026',
    driveUrl: 'https://drive.google.com/drive/folders/1kSf19bTtn0jfwrAyg81ZBgPOqtuBOQ1x',
    type: 'album',
  },
  {
    id: 'gal-workshops-archive',
    title: 'Technical Workshops & Hackathon Project Archives',
    category: 'Workshops',
    caption: 'Archival media from student project presentations, robotics ideathons, and mentorship sessions.',
    date: 'June 2026',
    driveUrl: 'https://drive.google.com/drive/folders/1X2Z8WaqNmAqcB0M8Gvy64ZNhgYYcu8Pp',
    type: 'album',
  },
]
