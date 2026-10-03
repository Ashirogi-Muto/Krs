import path from 'node:path'
import type { Access, CollectionConfig } from 'payload'
import { CONTENT_EDITORS, adminsOnly, hasRole, hiddenUnless } from '../access/roles'
import { GALLERY_CATEGORIES } from '../../lib/data/seed-gallery'

// Website content: admins and Media & outreach edit; only admins delete (Media may also delete gallery files)
const editors: Access = ({ req: { user } }) => hasRole(user, CONTENT_EDITORS)
const contentAccess = { create: editors, update: editors, delete: adminsOnly }
const contentHidden = hiddenUnless(CONTENT_EDITORS)

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
  access: contentAccess,
  admin: {
    hidden: contentHidden,
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'year', 'featured', 'published', 'needsReview'],
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
  access: contentAccess,
  admin: {
    hidden: contentHidden,
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'author', 'publishedAt', 'published', 'needsReview'],
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
  access: contentAccess,
  admin: {
    hidden: contentHidden,
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'difficulty', 'resourceType', 'published', 'needsReview'],
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
  access: contentAccess,
  admin: {
    hidden: contentHidden,
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'teamGroup', 'active', 'published', 'needsReview'],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'role', type: 'text', required: true },
    { name: 'department', type: 'text', required: true },
    {
      name: 'teamGroup',
      type: 'select',
      required: true,
      options: [
        { label: 'Faculty Coordination', value: 'FACULTY' },
        { label: 'Core Leadership', value: 'LEADERSHIP' },
        { label: 'Robotics & Hardware', value: 'ROBOTICS' },
        { label: 'Software & AI', value: 'SOFTWARE_AI' },
        { label: 'Electronics & PCB', value: 'ELECTRONICS' },
        { label: 'Mechanical & CAD', value: 'MECHANICAL' },
        { label: 'Media & Operations', value: 'MEDIA' },
      ],
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
  access: { create: editors, update: editors, delete: editors },
  admin: { hidden: contentHidden },
  upload: {
    // Absolute so it is the same in the standalone build (/app/public/uploads, the uploads volume)
    staticDir: path.resolve(process.cwd(), 'public/uploads'),
    // No SVG: an uploaded SVG is served from this origin and can carry script (stored XSS)
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'application/pdf'],
  },
  fields: [
    { name: 'alt', type: 'text', required: true },
    { name: 'caption', type: 'text' },
  ],
}


/** KRS gallery: albums / videos (usually Google Drive links) shown on /gallery. */
export const GalleryAlbums: CollectionConfig = {
  slug: 'gallery-albums',
  labels: { singular: 'Gallery album', plural: 'Gallery albums' },
  access: { create: editors, update: editors, delete: editors },
  admin: {
    group: 'Website',
    hidden: contentHidden,
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'date', 'sortOrder', 'published'],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        { name: 'category', type: 'select', required: true, options: GALLERY_CATEGORIES.map((c) => ({ label: c, value: c })) },
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
    { name: 'caption', type: 'textarea', required: true },
    { name: 'driveUrl', type: 'text', required: true, admin: { description: 'Link to the Google Drive folder or video (shared "anyone with the link").' } },
    { ...cover, admin: { description: 'Optional photo shown on the card.' } },
    { name: 'sortOrder', type: 'number', defaultValue: 100, admin: { position: 'sidebar', description: 'Lower numbers first.' } },
    publishing[0],
  ],
}
