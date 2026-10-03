import type { Field, GlobalConfig } from 'payload'
import { CONTENT_EDITORS, hasRole } from '../access/roles'

const text = (name: string, label?: string, long = false): Field =>
  long ? { name, label, type: 'textarea', admin: { rows: 3 } } : { name, label, type: 'text' }
const header = (name: string, label: string): Field => ({
  name,
  label,
  type: 'group',
  fields: [text('eyebrow', 'Small line above the title'), text('title', 'Title'), text('intro', 'Intro', true)],
})

/** Headings and intro texts of the main pages (empty field = built-in text). Media & outreach edit. */
export const PageTexts: GlobalConfig = {
  slug: 'page-texts',
  label: 'Page texts',
  admin: {
    group: 'Website',
    description: 'Retired: page texts are edited in Website → Pages.',
    // Retired 2026-10-03: every page now comes from Pages. Kept registered so its tables and data stay intact.
    hidden: true,
  },
  access: { read: () => true, update: ({ req: { user } }) => hasRole(user, CONTENT_EDITORS) },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'KRS home',
          fields: [
            {
              name: 'home',
              type: 'group',
              label: false,
              fields: [
                text('heroEyebrow', 'Hero: small line'),
                text('heroIntro', 'Hero: intro', true),
                text('aboutEyebrow', 'About: small line'),
                text('aboutTitle', 'About: title'),
                text('domainsTitle', 'Domains: title'),
                text('aurixEyebrow', 'AURIX block: small line'),
                text('aurixTitle', 'AURIX block: title'),
                text('aurixIntro', 'AURIX block: text', true),
                text('aurixButton', 'AURIX block: button'),
                text('hackathonButton', 'AURIX block: hackathon button'),
                text('pillarsEyebrow', 'Pillars: small line'),
                text('pillarsTitle', 'Pillars: title'),
              ],
            },
          ],
        },
        {
          label: 'AURIX landing',
          fields: [
            {
              name: 'aurix',
              type: 'group',
              label: false,
              fields: [
                text('heroEyebrow', 'Hero: small line'),
                text('heroIntro', 'Hero: intro', true),
                text('exploreButton', 'Hero: competitions button'),
                text('portalButton', 'Hero: portal button (shown only when the portal is published)'),
                text('categoriesEyebrow', 'Categories: small line'),
                text('categoriesTitle', 'Categories: title'),
                text('categoriesIntro', 'Categories: intro', true),
                text('stepsEyebrow', 'How to compete: small line'),
                text('stepsTitle', 'How to compete: title'),
                {
                  name: 'steps',
                  type: 'array',
                  labels: { singular: 'Step', plural: 'Steps' },
                  maxRows: 6,
                  admin: { description: 'Use {dates} to insert the event dates from the CMS.' },
                  fields: [text('title', 'Title'), text('text', 'Text', true)],
                },
                text('comparisonEyebrow', 'Comparison: small line'),
                text('comparisonTitle', 'Comparison: title'),
              ],
            },
          ],
        },
        { label: 'Competitions', fields: [header('competitions', 'Competitions page')] },
        { label: 'FAQ', fields: [header('faq', 'FAQ page')] },
        { label: 'Rules', fields: [header('rules', 'Rules page')] },
        {
          label: 'Insights',
          fields: [
            {
              name: 'insights',
              type: 'group',
              label: false,
              fields: [
                text('eyebrow', 'Small line above the title'),
                text('title', 'Title'),
                text('intro', 'Intro', true),
                {
                  name: 'cultures',
                  type: 'array',
                  labels: { singular: 'Culture card', plural: 'Culture cards' },
                  maxRows: 6,
                  fields: [text('title', 'Title'), text('text', 'Text', true)],
                },
                text('timelineEyebrow', 'Timeline: small line'),
                text('timelineTitle', 'Timeline: title'),
                {
                  name: 'timeline',
                  type: 'array',
                  labels: { singular: 'Milestone', plural: 'Milestones' },
                  admin: { description: 'Shown in this order. Only list milestones that really happened.' },
                  fields: [text('year', 'Year'), text('title', 'Title'), text('description', 'Description', true)],
                },
                text('affiliationLabel', 'Affiliation box: small line'),
                text('affiliationTitle', 'Affiliation box: title'),
                text('affiliationText', 'Affiliation box: text', true),
              ],
            },
          ],
        },
        { label: 'Gallery', fields: [header('gallery', 'Gallery page')] },
      ],
    },
  ],
}
