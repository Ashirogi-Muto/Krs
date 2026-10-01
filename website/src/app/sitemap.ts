import type { MetadataRoute } from 'next'
import { getAllEvents } from '@/lib/data/events'
import { SEED_PROJECTS, SEED_LEARNING_RESOURCES, SEED_BLOGS } from '@/lib/data/seed-krs'
import { isRouteVisible } from '@/lib/visibility'

// Re-read event data from the CMS at most once a minute
export const revalidate = 60

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://kalamroboticssociety.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // KRS Core Public Routes
  const krsRoutes = [
    '',
    '/gallery',
    '/learning',
    '/insights',
    '/projects',
    '/team',
    '/events',
    '/blogs',
    '/join',
    '/contact',
    '/privacy',
    '/terms',
  ]
    .filter(isRouteVisible)
    .map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))

  // AURIX Core Public Routes
  const aurixRoutes = [
    '/aurix',
    '/aurix/competitions',
    '/aurix/register',
    '/aurix/schedule',
    '/aurix/rules',
    '/aurix/faq',
    '/aurix/results',
  ]
    .filter(isRouteVisible)
    .map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: route === '/aurix' ? 0.9 : 0.8,
  }))

  // Dynamic Competition Routes (from seed events)
  const eventRoutes = (await getAllEvents()).filter((e) => e.status !== 'DRAFT').map((event) => ({
    url: `${BASE_URL}/aurix/${event.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }))

  // Dynamic Project Routes
  const projectRoutes = SEED_PROJECTS.map((project) => ({
    url: `${BASE_URL}/projects/${project.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Dynamic Learning Resource Routes
  const resourceRoutes = SEED_LEARNING_RESOURCES.map((resource) => ({
    url: `${BASE_URL}/learning/${resource.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Dynamic Blog Routes
  const blogRoutes = SEED_BLOGS.map((blog) => ({
    url: `${BASE_URL}/blogs/${blog.slug}`,
    lastModified: new Date(blog.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    ...krsRoutes,
    ...aurixRoutes,
    ...eventRoutes,
    ...projectRoutes,
    ...resourceRoutes,
    ...blogRoutes,
  ]
}
