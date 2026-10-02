import type { Payload } from 'payload'
import { SEED_PROJECTS, SEED_LEARNING_RESOURCES, SEED_BLOGS, SEED_TEAM } from '../lib/data/seed-krs'
import { logger } from '../lib/logger'

/**
 * One-time move of the KRS content that used to live in code (lib/data/seed-krs.ts) into the CMS.
 * Runs at startup:
 *   - an empty collection gets the bundled items;
 *   - an item that already exists (same slug / name) is refreshed from the bundled copy only if nobody ever edited
 *     it in the CMS (updatedAt == createdAt). After that refresh it counts as edited, so this happens once.
 * Everything is flagged "Needs review" (it was never fact-checked); the team list holds placeholder names, so it is
 * unpublished until real people are added.
 */
const rows = <T extends string>(values: string[] | undefined, key: T) => (values || []).map((v) => ({ [key]: v }) as Record<T, string>)

type Spec = { collection: 'projects' | 'posts' | 'resources' | 'people'; key: 'slug' | 'name'; items: { key: string; data: Record<string, any> }[] }

const specs = (): Spec[] => [
  {
    collection: 'projects',
    key: 'slug',
    items: SEED_PROJECTS.map((p) => ({
      key: p.slug,
      data: {
        title: p.title,
        slug: p.slug,
        shortDescription: p.shortDescription,
        description: p.description,
        status: p.status,
        year: p.year,
        domains: rows(p.domains, 'domain'),
        technologies: rows(p.technologies, 'technology'),
        hardwareSpecs: rows(p.hardwareSpecs, 'spec'),
        softwareSpecs: rows(p.softwareSpecs, 'spec'),
        teamLead: p.teamLead,
        results: p.results,
        githubUrl: p.githubUrl,
        demoUrl: p.demoUrl,
        videoUrl: p.videoUrl,
        driveUrl: p.driveUrl,
        featured: p.featured,
        published: true,
        needsReview: true,
      },
    })),
  },
  {
    collection: 'posts',
    key: 'slug',
    items: SEED_BLOGS.map((b) => ({
      key: b.slug,
      data: {
        title: b.title,
        slug: b.slug,
        summary: b.summary,
        content: b.content,
        category: b.category,
        author: b.author,
        readingTimeMinutes: b.readingTimeMinutes,
        publishedAt: b.publishedAt,
        tags: rows(b.tags, 'tag'),
        published: true,
        needsReview: true,
      },
    })),
  },
  {
    collection: 'resources',
    key: 'slug',
    items: SEED_LEARNING_RESOURCES.map((r) => ({
      key: r.slug,
      data: {
        title: r.title,
        slug: r.slug,
        category: r.category,
        difficulty: r.difficulty,
        estimatedTime: r.estimatedTime,
        resourceType: r.resourceType,
        summary: r.summary,
        content: r.content,
        author: r.author,
        tags: rows(r.tags, 'tag'),
        publishedAt: r.publishedAt,
        driveUrl: r.driveUrl,
        published: true,
        needsReview: true,
      },
    })),
  },
  {
    collection: 'people',
    key: 'name',
    items: SEED_TEAM.map((m, i) => ({
      key: m.name,
      data: {
        name: m.name,
        role: m.role,
        department: m.department,
        teamGroup: m.teamGroup,
        bio: m.bio,
        linkedin: m.linkedin,
        github: m.github,
        active: m.active,
        startYear: m.startYear,
        endYear: m.endYear,
        sortOrder: (i + 1) * 10,
        published: false, // placeholder names: add the real team, then publish
        needsReview: true,
      },
    })),
  },
]

const neverEdited = (doc: any) =>
  doc?.createdAt && doc?.updatedAt && Math.abs(new Date(doc.updatedAt).getTime() - new Date(doc.createdAt).getTime()) < 5000

export async function importSeedContent(payload: Payload) {
  for (const spec of specs()) {
    const created: (number | string)[] = []
    try {
      const { totalDocs } = await payload.count({ collection: spec.collection, overrideAccess: true })
      if (totalDocs === 0) {
        for (const item of spec.items) {
          const doc = await payload.create({ collection: spec.collection, overrideAccess: true, data: item.data as any })
          created.push(doc.id)
        }
        logger.info(`Imported ${created.length} ${spec.collection} from the bundled content into the CMS`)
        continue
      }
      let refreshed = 0
      for (const item of spec.items) {
        const { docs } = await payload.find({
          collection: spec.collection,
          overrideAccess: true,
          depth: 0,
          limit: 1,
          where: { [spec.key]: { equals: item.key } },
        })
        if (docs[0] && neverEdited(docs[0])) {
          await payload.update({ collection: spec.collection, id: docs[0].id, overrideAccess: true, data: item.data as any })
          refreshed += 1
        }
      }
      if (refreshed) logger.info(`Refreshed ${refreshed} never-edited ${spec.collection} from the bundled content`)
    } catch (err: any) {
      logger.error(`Importing ${spec.collection} into the CMS failed: ${err?.message || err}`)
      // All or nothing for a fresh import: a half-imported collection would never be retried (it is no longer empty)
      for (const id of created) await payload.delete({ collection: spec.collection, id, overrideAccess: true }).catch(() => undefined)
    }
  }
}
