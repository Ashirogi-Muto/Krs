import path from 'node:path'
import { requireRealFileType } from '../hooks/realFileType'

const MEDIA_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'application/pdf']
import { previewUrl } from '../../lib/preview-targets'
import type { Access, CollectionConfig } from 'payload'
import { hiddenUnlessAny, createAccess, keyAccess, keyAllowed } from '../access/roles'
import { accessFor } from '../access/permissions'
import { GALLERY_CATEGORIES } from '../../lib/data/seed-gallery'
import { TEAM_GROUP_OPTIONS } from '../../lib/data/team-groups'

// Website content (access roles: per page View / Create / Edit / Delete, optionally limited to chosen documents)
const readPublishedOr =
  (key: string): Access =>
  ({ req: { user } }) => {
    const own = accessFor(user, key, 'id')
    return own === true ? true : own ? ({ or: [{ published: { equals: true } }, own] } as any) : { published: { equals: true } }
  }
const contentAccess = (id: string) => ({
  read: readPublishedOr(`${id}.view`),
  create: createAccess(`${id}.create`),
  update: keyAccess(`${id}.edit`),
  delete: keyAccess(`${id}.delete`),
})
const contentHidden = (id: string) => hiddenUnlessAny([`${id}.view`, `${id}.create`, `${id}.edit`, `${id}.delete`])

/** Sidebar switches shared by all website content: shown on the site, and flagged for fact-checking. */
const publishing = [
  {
    name: 'published',
    type: 'checkbox' as const,
    defaultValue: true,
    index: true,
    admin: { position: 'sidebar' as const, description: 'Untick to hide this from the website without deleting it.' },
  },
  {
    name: 'needsReview',
    type: 'checkbox' as const,
    defaultValue: false,
    admin: { position: 'sidebar' as const, description: 'Content copied from the old site that still needs checking. Untick once verified.' },
  },
]
const cover = { name: 'coverImage', type: 'upload' as const, relationTo: 'media' as const }

export const Projects: CollectionConfig = {
  slug: 'projects',
  access: contentAccess('projects'),
  admin: {
    hidden: contentHidden('projects'),
    description:
      'Projects on /projects (cards) and their own pages /projects/<slug>. Untick Published to hide one; Featured shows it on the KRS home page.',
    useAsTitle: 'title',
    preview: (doc) => (doc?.slug ? `/projects/${doc.slug}` : null), // "Preview" button: the live page
    livePreview: { url: ({ data }) => previewUrl({ collection: 'projects', id: data?.id }) }, // side panel; refreshes on Save
    defaultColumns: ['title', 'status', 'year', 'featured', 'published', 'needsReview'],
    listSearchableFields: ['title', 'slug', 'teamLead', 'shortDescription'],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'shortDescription', type: 'textarea', required: true },
    { name: 'description', type: 'textarea', required: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'IN_PROGRESS',
      options: [
        { label: 'Completed', value: 'COMPLETED' },
        { label: 'In Progress', value: 'IN_PROGRESS' },
        { label: 'Concept / Research', value: 'CONCEPT' },
      ],
    },
    { name: 'year', type: 'number', required: true, defaultValue: 2026 },
    {
      name: 'domains',
      type: 'array',
      fields: [{ name: 'domain', type: 'text', required: true }],
    },
    {
      name: 'technologies',
      type: 'array',
      fields: [{ name: 'technology', type: 'text', required: true }],
    },
    {
      name: 'hardwareSpecs',
      type: 'array',
      fields: [{ name: 'spec', type: 'text' }],
    },
    {
      name: 'softwareSpecs',
      type: 'array',
      fields: [{ name: 'spec', type: 'text' }],
    },
    { name: 'teamLead', type: 'text' },
    { name: 'results', type: 'textarea' },
    cover,
    { name: 'githubUrl', type: 'text' },
    { name: 'demoUrl', type: 'text' },
    { name: 'videoUrl', type: 'text' },
    { name: 'driveUrl', type: 'text', admin: { description: 'Google Drive folder with photos / documents.' } },
    { name: 'featured', type: 'checkbox', defaultValue: false, admin: { description: 'Show on the home page.' } },
    ...publishing,
  ],
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: contentAccess('posts'),
  admin: {
    hidden: contentHidden('posts'),
    description:
      'Blog posts on /blogs and their own pages /blogs/<slug>. Untick Published to hide one.',
    useAsTitle: 'title',
    preview: (doc) => (doc?.slug ? `/blogs/${doc.slug}` : null), // "Preview" button: the live page
    livePreview: { url: ({ data }) => previewUrl({ collection: 'posts', id: data?.id }) }, // side panel; refreshes on Save
    defaultColumns: ['title', 'category', 'author', 'publishedAt', 'published', 'needsReview'],
    listSearchableFields: ['title', 'slug', 'author', 'summary'],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'summary', type: 'textarea', required: true },
    { name: 'content', type: 'textarea', required: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Robotics', value: 'Robotics' },
        { label: 'AI & Machine Learning', value: 'AI' },
        { label: 'Electronics', value: 'Electronics' },
        { label: 'Project Stories', value: 'Project Stories' },
        { label: 'Tutorials', value: 'Tutorials' },
        { label: 'Event Recaps', value: 'Event Recaps' },
        { label: 'Club News', value: 'Club News' },
      ],
    },
    { name: 'author', type: 'text', required: true },
    { name: 'readingTimeMinutes', type: 'number', defaultValue: 5 },
    { name: 'publishedAt', type: 'date', required: true },
    cover,
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text' }],
    },
    ...publishing,
  ],
}

export const Resources: CollectionConfig = {
  slug: 'resources',
  access: contentAccess('resources'),
  admin: {
    hidden: contentHidden('resources'),
    description:
      'Learning material on /learning and its own pages /learning/<slug>. Untick Published to hide one.',
    useAsTitle: 'title',
    preview: (doc) => (doc?.slug ? `/learning/${doc.slug}` : null), // "Preview" button: the live page
    livePreview: { url: ({ data }) => previewUrl({ collection: 'resources', id: data?.id }) }, // side panel; refreshes on Save
    defaultColumns: ['title', 'category', 'difficulty', 'resourceType', 'published', 'needsReview'],
    listSearchableFields: ['title', 'slug', 'category', 'author'],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'category', type: 'text', required: true },
    {
      name: 'difficulty',
      type: 'select',
      required: true,
      defaultValue: 'INTERMEDIATE',
      options: [
        { label: 'Beginner', value: 'BEGINNER' },
        { label: 'Intermediate', value: 'INTERMEDIATE' },
        { label: 'Advanced', value: 'ADVANCED' },
      ],
    },
    { name: 'estimatedTime', type: 'text', defaultValue: '30 mins' },
    {
      name: 'resourceType',
      type: 'select',
      required: true,
      defaultValue: 'ARTICLE',
      options: [
        { label: 'Article', value: 'ARTICLE' },
        { label: 'Tutorial', value: 'TUTORIAL' },
        { label: 'PDF Guide', value: 'PDF' },
        { label: 'Video Resource', value: 'VIDEO' },
        { label: 'Project Walkthrough', value: 'PROJECT' },
        { label: 'External Resource', value: 'EXTERNAL' },
      ],
    },
    { name: 'summary', type: 'textarea', required: true },
    { name: 'content', type: 'textarea', required: true },
    { name: 'author', type: 'text', required: true },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text' }],
    },
    { name: 'publishedAt', type: 'date', required: true },
    { name: 'driveUrl', type: 'text', admin: { description: 'Google Drive link to the material, if any.' } },
    ...publishing,
  ],
}

export const People: CollectionConfig = {
  slug: 'people',
  access: contentAccess('people'),
  admin: {
    hidden: contentHidden('people'),
    description:
      'Team members on /team, grouped by Team group and ordered by Sort order. Untick Published to hide someone; untick Active to show them as alumni.',
    useAsTitle: 'name',
    preview: () => '/team', // "Preview" button: the page that lists people
    defaultColumns: ['name', 'role', 'teamGroup', 'active', 'published', 'needsReview'],
    listSearchableFields: ['name', 'role', 'department'],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'text', required: true },
    { name: 'department', type: 'text', required: true },
    {
      name: 'teamGroup',
      type: 'select',
      required: true,
      options: TEAM_GROUP_OPTIONS,
    },
    { name: 'bio', type: 'textarea', required: true },
    { name: 'linkedin', type: 'text' },
    { name: 'github', type: 'text' },
    { name: 'active', type: 'checkbox', defaultValue: true },
    { name: 'startYear', type: 'number', required: true, defaultValue: 2025 },
    { name: 'endYear', type: 'number' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    { name: 'sortOrder', type: 'number', defaultValue: 100, admin: { description: 'Lower numbers are listed first within a group.' } },
    ...publishing,
  ],
}

export const Media: CollectionConfig = {
  slug: 'media',
  // Public website images (logos, page images): visitors must be able to load them. ID cards are in the
  // separate, private id-documents collection.
  access: { read: () => true, create: keyAllowed('media.create'), update: keyAllowed('media.edit'), delete: keyAllowed('media.delete') },
  admin: {
    hidden: hiddenUnlessAny(['media.create', 'media.edit', 'media.delete']),
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
    listSearchableFields: ['filename', 'alt', 'caption'],
    description:
      'Every image and PDF used on the website (photos of people, project covers, gallery photos, logos). Upload here or straight from any image field. You can drop several files at once.',
  },
  upload: {
    // Absolute so it is the same in the standalone build (/app/public/uploads, the uploads volume)
    staticDir: path.resolve(process.cwd(), 'public/uploads'),
    // No SVG: an uploaded SVG is served from this origin and can carry script (stored XSS)
    mimeTypes: MEDIA_TYPES,
  },
  // The real type (first bytes) must match too: a renamed HTML/SVG file is refused
  hooks: { beforeValidate: [requireRealFileType(MEDIA_TYPES)] },
  fields: [
    // Optional (owner, 7 Oct 2026): without it the page uses the gallery entry's / item's title for screen readers
    { name: 'alt', type: 'text', label: 'Description (optional)', admin: { description: 'What the image shows, for screen readers and search engines.' } },
    { name: 'caption', type: 'text', label: 'Caption (optional)' },
  ],
}


/** KRS gallery: albums / videos (usually Google Drive links) shown on /gallery. */
export const GalleryAlbums: CollectionConfig = {
  slug: 'gallery-albums',
  labels: { singular: 'Gallery entry', plural: 'Gallery' },
  access: contentAccess('gallery'),
  admin: {
    group: 'Website',
    hidden: contentHidden('gallery'),
    useAsTitle: 'title',
    preview: () => '/gallery', // "Preview" button: the page that shows the photos
    defaultColumns: ['title', 'category', 'date', 'sortOrder', 'published'],
    listSearchableFields: ['title', 'caption', 'date'],
    description:
      'Photos on the /gallery page, shown as a grid of images. One entry can hold many photos: open an entry, click "Photos" and drop several images at once. Only the photos are needed; title, category and caption are optional.',
  },
  fields: [
    {
      // Owner, 7 Oct 2026: the gallery is a grid of images; upload many at once here
      name: 'photos',
      label: 'Photos',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: { description: 'Drop one or many images. Each photo becomes a tile in the gallery grid, in this order.' },
      validate: (value: unknown, { siblingData }: { siblingData: Record<string, unknown> }) =>
        (Array.isArray(value) && value.length > 0) || siblingData?.coverImage ? true : 'Add at least one photo.',
    },
    { name: 'title', type: 'text', admin: { description: 'Optional: shown when someone hovers over a photo.' } },
    {
      type: 'row',
      fields: [
        { name: 'category', type: 'select', options: GALLERY_CATEGORIES.map((c) => ({ label: c, value: c })), admin: { description: 'Optional: used by the category filter.' } },
        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'album',
          options: [
            { label: 'Photo album', value: 'album' },
            { label: 'Video', value: 'video' },
          ],
        },
        { name: 'date', type: 'text', admin: { description: 'As shown, e.g. "September 2026".' } },
      ],
    },
    { name: 'caption', type: 'textarea', admin: { description: 'Optional: shown with the title when someone hovers over a photo.' } },
    // Optional (owner, 4 Oct 2026). Not shown in the image grid (7 Oct); kept for the record
    { name: 'driveUrl', type: 'text', admin: { description: 'Optional: link to the full Google Drive folder (kept for reference; the grid shows the photos).' } },
    { ...cover, label: 'First photo', admin: { description: 'Optional: shown before the other photos (older entries used only this).' } },
    { name: 'sortOrder', type: 'number', defaultValue: 100, admin: { position: 'sidebar', description: 'Lower numbers first.' } },
    publishing[0],
  ],
}
