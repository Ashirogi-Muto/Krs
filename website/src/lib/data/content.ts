import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import { logger } from '@/lib/logger'
import { SEED_PROJECTS, SEED_LEARNING_RESOURCES, SEED_BLOGS, SEED_TEAM } from './seed-krs'
import { getSiteSettings } from '../site-settings'
import { ProjectItem, LearningResource, BlogPost, TeamMemberProfile } from './types'

/**
 * KRS website content, read from the CMS (Projects, Posts, Resources, People; only items ticked "Published").
 * The bundled seed copy is used only when the database is unreachable (for example during `next build`).
 */
type Doc = Record<string, any>
type Slug = 'projects' | 'posts' | 'resources' | 'people'

const list = (rows: unknown, key: string): string[] =>
  Array.isArray(rows) ? rows.map((r: Doc) => r?.[key]).filter((v): v is string => Boolean(v)) : []
const mediaUrl = (m: unknown): string | undefined => (m && typeof m === 'object' && (m as Doc).url ? String((m as Doc).url) : undefined)
const iso = (v: unknown) => (v ? new Date(String(v)).toISOString() : '')

async function fromCms<T>(collection: Slug, sort: string, map: (d: Doc) => T, where?: Where): Promise<T[] | null> {
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection,
      where: where ? { and: [{ published: { equals: true } }, where] } : { published: { equals: true } },
      sort,
      depth: 1,
      limit: 500,
    })
    return (docs as Doc[]).map(map)
  } catch (err: any) {
    logger.warn(`CMS ${collection} unavailable, using bundled content: ${err?.message || err}`)
    return null
  }
}

const toProject = (d: Doc): ProjectItem => ({
  id: String(d.id),
  title: d.title,
  slug: d.slug,
  shortDescription: d.shortDescription,
  description: d.description,
  coverImage: mediaUrl(d.coverImage),
  status: d.status,
  year: d.year,
  domains: list(d.domains, 'domain'),
  technologies: list(d.technologies, 'technology'),
  teamLead: d.teamLead || undefined,
  hardwareSpecs: list(d.hardwareSpecs, 'spec'),
  softwareSpecs: list(d.softwareSpecs, 'spec'),
  results: d.results || undefined,
  githubUrl: d.githubUrl || undefined,
  demoUrl: d.demoUrl || undefined,
  driveUrl: d.driveUrl || undefined,
  videoUrl: d.videoUrl || undefined,
  featured: Boolean(d.featured),
})

const toResource = (d: Doc): LearningResource => ({
  id: String(d.id),
  title: d.title,
  slug: d.slug,
  category: d.category,
  difficulty: d.difficulty,
  estimatedTime: d.estimatedTime || '',
  resourceType: d.resourceType,
  summary: d.summary,
  content: d.content,
  author: d.author,
  tags: list(d.tags, 'tag'),
  publishedAt: iso(d.publishedAt),
  driveUrl: d.driveUrl || undefined,
})

const toBlog = (d: Doc): BlogPost => ({
  id: String(d.id),
  title: d.title,
  slug: d.slug,
  summary: d.summary,
  content: d.content,
  category: d.category,
  author: d.author,
  readingTimeMinutes: d.readingTimeMinutes ?? 5,
  publishedAt: iso(d.publishedAt),
  updatedAt: iso(d.updatedAt) || undefined,
  coverImage: mediaUrl(d.coverImage),
  tags: list(d.tags, 'tag'),
})

const toPerson = (d: Doc): TeamMemberProfile => ({
  id: String(d.id),
  name: d.name,
  role: d.role,
  department: d.department,
  teamGroup: d.teamGroup,
  bio: d.bio,
  linkedin: d.linkedin || undefined,
  github: d.github || undefined,
  active: Boolean(d.active),
  startYear: d.startYear,
  endYear: d.endYear ?? undefined,
  photo: mediaUrl(d.photo),
})

/** Society details (CMS: Site settings → Society); built-in defaults until saved. */
export async function getGeneralInfo() {
  const s = await getSiteSettings()
  return { name: s.name, shortName: s.shortName, institution: s.institution, location: s.location, motto: s.motto, about: s.about, domains: s.domains, pillars: s.pillars }
}

export async function getAllProjects(): Promise<ProjectItem[]> {
  return (await fromCms('projects', 'createdAt', toProject)) ?? SEED_PROJECTS
}

export async function getFeaturedProjects(): Promise<ProjectItem[]> {
  return (await getAllProjects()).filter((p) => p.featured)
}

export async function getProjectBySlug(slug: string): Promise<ProjectItem | null> {
  return (await getAllProjects()).find((p) => p.slug === slug) || null
}

export async function getAllResources(category?: string): Promise<LearningResource[]> {
  const all = (await fromCms('resources', 'createdAt', toResource)) ?? SEED_LEARNING_RESOURCES
  return category ? all.filter((r) => r.category.toLowerCase() === category.toLowerCase()) : all
}

export async function getResourceBySlug(slug: string): Promise<LearningResource | null> {
  return (await getAllResources()).find((r) => r.slug === slug) || null
}

export async function getAllBlogs(category?: string): Promise<BlogPost[]> {
  const all = (await fromCms('posts', '-publishedAt', toBlog)) ?? SEED_BLOGS
  return category ? all.filter((b) => b.category.toLowerCase() === category.toLowerCase()) : all
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  return (await getAllBlogs()).find((b) => b.slug === slug) || null
}

export async function getTeamMembers(): Promise<TeamMemberProfile[]> {
  return (await fromCms('people', 'sortOrder', toPerson)) ?? SEED_TEAM
}
