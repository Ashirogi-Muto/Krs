export type EventStatus =
  | 'DRAFT'
  | 'ANNOUNCED'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'IN_PROGRESS'
  | 'JUDGING'
  | 'RESULTS_PENDING'
  | 'RESULTS_PUBLISHED'
  | 'ARCHIVED'

export type EventType =
  | 'HACKATHON'
  | 'ROBO_SOCCER'
  | 'ROBO_RACE'
  | 'ROBO_EXPO'
  | 'ROBO_IDEATHON'
  | 'WORKSHOP'
  | 'OTHER'

export interface EventTrack {
  id: string
  number: number
  name: string
  mission: string
  examples: string[]
}

export interface EventRound {
  id: string
  number: number
  name: string
  description: string
  startDate: string
  endDate: string
  submissionType: 'PROPOSAL' | 'CODE_AND_DEMO' | 'PRESENTATION' | 'IN_PERSON_DEMO'
  evaluationFormat?: string
}

export interface JudgingCriterion {
  id: string
  name: string
  description: string
  weightPercent?: number
  maxScore: number
}

export interface EventRuleSection {
  title: string
  rules: string[]
}

export interface EventScheduleItem {
  timeLabel: string
  title: string
  description: string
  location?: string
}

export interface EventFAQItem {
  question: string
  answer: string
}

export interface GenericEvent {
  id: string
  title: string
  shortName: string
  slug: string
  edition: string
  series: 'AURIX' | 'KRS'
  description: string
  shortDescription: string
  status: EventStatus
  eventType: EventType
  heroImage?: string
  startDate: string
  endDate: string
  registrationOpen: string
  registrationClose: string
  timezone: string
  venue: string
  location: string
  registrationFee: number | null // in INR; null if not stated in source materials
  currency: string
  minTeamSize: number | null // null if not confirmed in source materials
  maxTeamSize: number | null
  operatorCount?: number // distinctly modeled per Pre-Flight Correction #4
  participantRequirements?: string
  requiresPayment: boolean
  requiresSubmission: boolean
  requiresJudging: boolean
  tracks?: EventTrack[]
  rounds?: EventRound[]
  rulesSections?: EventRuleSection[]
  judgingCriteria?: JudgingCriterion[]
  schedule?: EventScheduleItem[]
  faqs?: EventFAQItem[]
  resultsPublished: boolean
  featured: boolean
  specialNotice?: string // e.g. "Arena configuration revealed during the event"
}

export interface ProjectItem {
  id: string
  title: string
  slug: string
  shortDescription: string
  description: string
  coverImage?: string
  status: 'COMPLETED' | 'IN_PROGRESS' | 'CONCEPT'
  year: number
  domains: string[]
  technologies: string[]
  teamLead?: string
  hardwareSpecs?: string[]
  softwareSpecs?: string[]
  results?: string
  githubUrl?: string
  demoUrl?: string
  featured: boolean
}

export interface LearningResource {
  id: string
  title: string
  slug: string
  category: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  estimatedTime: string
  resourceType: 'ARTICLE' | 'TUTORIAL' | 'PDF' | 'VIDEO' | 'PROJECT' | 'EXTERNAL'
  summary: string
  content: string
  author: string
  tags: string[]
  publishedAt: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  summary: string
  content: string
  category: string
  author: string
  readingTimeMinutes: number
  publishedAt: string
  updatedAt?: string
  coverImage?: string
  tags: string[]
}

export interface TeamMemberProfile {
  id: string
  name: string
  role: string
  department: string
  teamGroup: 'FACULTY' | 'LEADERSHIP' | 'ROBOTICS' | 'SOFTWARE_AI' | 'ELECTRONICS' | 'MECHANICAL' | 'MEDIA'
  bio: string
  linkedin?: string
  github?: string
  active: boolean
  startYear: number
  endYear?: number
}
