import {
  SEED_PROJECTS,
  SEED_LEARNING_RESOURCES,
  SEED_BLOGS,
  SEED_TEAM,
  KRS_GENERAL_INFO,
} from './seed-krs'
import { ProjectItem, LearningResource, BlogPost, TeamMemberProfile } from './types'

export async function getGeneralInfo() {
  return KRS_GENERAL_INFO
}

export async function getAllProjects(): Promise<ProjectItem[]> {
  return SEED_PROJECTS
}

export async function getFeaturedProjects(): Promise<ProjectItem[]> {
  return SEED_PROJECTS.filter((p) => p.featured)
}

export async function getProjectBySlug(slug: string): Promise<ProjectItem | null> {
  return SEED_PROJECTS.find((p) => p.slug === slug) || null
}

export async function getAllResources(category?: string): Promise<LearningResource[]> {
  if (category) {
    return SEED_LEARNING_RESOURCES.filter((r) => r.category.toLowerCase() === category.toLowerCase())
  }
  return SEED_LEARNING_RESOURCES
}

export async function getResourceBySlug(slug: string): Promise<LearningResource | null> {
  return SEED_LEARNING_RESOURCES.find((r) => r.slug === slug) || null
}

export async function getAllBlogs(category?: string): Promise<BlogPost[]> {
  if (category) {
    return SEED_BLOGS.filter((b) => b.category.toLowerCase() === category.toLowerCase())
  }
  return SEED_BLOGS
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  return SEED_BLOGS.find((b) => b.slug === slug) || null
}

export async function getTeamMembers(): Promise<TeamMemberProfile[]> {
  return SEED_TEAM
}
