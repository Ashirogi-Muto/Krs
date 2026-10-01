import { getPayload } from 'payload'
import config from '../payload.config'
import { SEED_AURIX_EVENTS } from '../lib/data/seed-events'
import {
  SEED_PROJECTS,
  SEED_LEARNING_RESOURCES,
  SEED_BLOGS,
  SEED_TEAM,
} from '../lib/data/seed-krs'

async function seed() {
  console.log('--- Initializing Payload CMS ---')
  const payload = await getPayload({ config })
  console.log('Connected to Payload CMS & PostgreSQL!')

  // 1. Seed Super Admin User
  const adminEmail = process.env.SEED_ADMIN_EMAIL
  const adminPassword = process.env.SEED_ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    console.error('ERROR: SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD environment variables are required.')
    process.exit(1)
  }

  const existingUsers = await payload.find({
    collection: 'users',
    where: {
      email: {
        equals: adminEmail,
      },
    },
  })

  if (existingUsers.totalDocs === 0) {
    console.log('Seeding Super Admin user...')
    await payload.create({
      collection: 'users',
      data: {
        name: 'KRS System Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'SUPER_ADMIN',
        institution: 'IILM University, Greater Noida',
      },
    })
    console.log(`Super Admin user created: ${adminEmail}`)
  } else {
    console.log('Super Admin user already exists.')
  }

  // 2. Seed Events
  console.log('Seeding AURIX & KRS Events...')
  for (const event of SEED_AURIX_EVENTS) {
    const existing = await payload.find({
      collection: 'events',
      where: {
        slug: {
          equals: event.slug,
        },
      },
    })

    if (existing.totalDocs === 0) {
      await payload.create({
        collection: 'events',
        data: {
          title: event.title,
          shortName: event.shortName,
          slug: event.slug,
          edition: event.edition,
          series: event.series,
          eventType: event.eventType,
          status: event.status,
          shortDescription: event.shortDescription,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          registrationOpen: event.registrationOpen,
          registrationClose: event.registrationClose,
          venue: event.venue,
          location: event.location,
          registrationFee: event.registrationFee ?? undefined,
          currency: event.currency,
          minTeamSize: event.minTeamSize ?? undefined,
          maxTeamSize: event.maxTeamSize ?? undefined,
          operatorCount: event.operatorCount ?? undefined,
          specialNotice: event.specialNotice,
          requiresPayment: event.requiresPayment,
          requiresSubmission: event.requiresSubmission,
          requiresJudging: event.requiresJudging,
          resultsPublished: event.resultsPublished,
          featured: event.featured,
          tracks: event.tracks?.map((t) => ({
            number: t.number,
            name: t.name,
            mission: t.mission,
            examples: t.examples.map((ex) => ({ item: ex })),
          })),
          rounds: event.rounds?.map((r) => ({
            number: r.number,
            name: r.name,
            description: r.description,
            startDate: r.startDate,
            endDate: r.endDate,
            submissionType: r.submissionType,
            evaluationFormat: r.evaluationFormat,
          })),
          judgingCriteria: event.judgingCriteria?.map((jc) => ({
            name: jc.name,
            description: jc.description,
            maxScore: jc.maxScore,
            weightPercent: jc.weightPercent,
          })),
          schedule: event.schedule?.map((s) => ({
            timeLabel: s.timeLabel,
            title: s.title,
            description: s.description,
            location: s.location,
          })),
          faqs: event.faqs?.map((f) => ({
            question: f.question,
            answer: f.answer,
          })),
        },
      })
      console.log(`Created event: ${event.title}`)
    } else {
      console.log(`Event already exists: ${event.slug}`)
    }
  }

  // 3. Seed Projects
  console.log('Seeding Projects...')
  for (const proj of SEED_PROJECTS) {
    const existing = await payload.find({
      collection: 'projects',
      where: {
        slug: {
          equals: proj.slug,
        },
      },
    })

    if (existing.totalDocs === 0) {
      await payload.create({
        collection: 'projects',
        data: {
          title: proj.title,
          slug: proj.slug,
          shortDescription: proj.shortDescription,
          description: proj.description,
          status: proj.status,
          year: proj.year,
          domains: proj.domains.map((d) => ({ domain: d })),
          technologies: proj.technologies.map((t) => ({ technology: t })),
          hardwareSpecs: proj.hardwareSpecs?.map((h) => ({ spec: h })),
          softwareSpecs: proj.softwareSpecs?.map((s) => ({ spec: s })),
          results: proj.results,
          githubUrl: proj.githubUrl,
          demoUrl: proj.demoUrl || proj.videoUrl,
          featured: proj.featured,
        },
      })
      console.log(`Created project: ${proj.title}`)
    } else {
      console.log(`Project already exists: ${proj.slug}`)
    }
  }

  // 4. Seed Learning Resources
  console.log('Seeding Learning Resources...')
  for (const res of SEED_LEARNING_RESOURCES) {
    const existing = await payload.find({
      collection: 'resources',
      where: {
        slug: {
          equals: res.slug,
        },
      },
    })

    if (existing.totalDocs === 0) {
      await payload.create({
        collection: 'resources',
        data: {
          title: res.title,
          slug: res.slug,
          category: res.category,
          difficulty: res.difficulty,
          estimatedTime: res.estimatedTime,
          resourceType: (res.resourceType === 'PROJECT' ? 'TUTORIAL' : res.resourceType) as any,
          summary: res.summary,
          content: res.content,
          author: res.author,
          tags: res.tags.map((t) => ({ tag: t })),
          publishedAt: res.publishedAt,
        },
      })
      console.log(`Created learning resource: ${res.title}`)
    } else {
      console.log(`Resource already exists: ${res.slug}`)
    }
  }

  // 5. Seed Blogs
  console.log('Seeding Blog Posts...')
  for (const blog of SEED_BLOGS) {
    const existing = await payload.find({
      collection: 'posts',
      where: {
        slug: {
          equals: blog.slug,
        },
      },
    })

    if (existing.totalDocs === 0) {
      await payload.create({
        collection: 'posts',
        data: {
          title: blog.title,
          slug: blog.slug,
          summary: blog.summary,
          content: blog.content,
          category: blog.category === 'Project Stories' ? 'Project Stories' : 'Robotics',
          author: blog.author,
          readingTimeMinutes: blog.readingTimeMinutes,
          publishedAt: blog.publishedAt,
          tags: blog.tags.map((t) => ({ tag: t })),
        },
      })
      console.log(`Created blog post: ${blog.title}`)
    } else {
      console.log(`Blog already exists: ${blog.slug}`)
    }
  }

  // 6. Seed People
  console.log('Seeding Team Members...')
  for (const person of SEED_TEAM) {
    const existing = await payload.find({
      collection: 'people',
      where: {
        name: {
          equals: person.name,
        },
      },
    })

    if (existing.totalDocs === 0) {
      await payload.create({
        collection: 'people',
        data: {
          name: person.name,
          role: person.role,
          department: person.department,
          teamGroup: person.teamGroup,
          bio: person.bio,
          linkedin: person.linkedin,
          github: person.github,
          active: person.active,
          startYear: person.startYear,
          endYear: person.endYear,
        },
      })
      console.log(`Created team profile: ${person.name}`)
    } else {
      console.log(`Team profile already exists: ${person.name}`)
    }
  }

  console.log('--- CMS Seeding Completed Successfully! ---')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
