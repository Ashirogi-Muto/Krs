import path from 'node:path'
import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'year', 'featured'],
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
    { name: 'results', type: 'textarea' },
    { name: 'githubUrl', type: 'text' },
    { name: 'demoUrl', type: 'text' },
    { name: 'featured', type: 'checkbox', defaultValue: false },
  ],
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'author', 'publishedAt'],
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
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text' }],
    },
  ],
}

export const Resources: CollectionConfig = {
  slug: 'resources',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'difficulty', 'resourceType'],
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
  ],
}

export const People: CollectionConfig = {
  slug: 'people',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'teamGroup', 'active'],
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
  ],
}

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    // Absolute so it is the same in the standalone build (/app/public/uploads, the uploads volume)
    staticDir: path.resolve(process.cwd(), 'public/uploads'),
    mimeTypes: ['image/*', 'application/pdf'],
  },
  fields: [
    { name: 'alt', type: 'text', required: true },
    { name: 'caption', type: 'text' },
  ],
}
