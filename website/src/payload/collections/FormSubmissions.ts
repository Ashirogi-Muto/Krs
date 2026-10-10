import type { CollectionConfig } from 'payload'
import { hiddenUnlessAny, isAdmin, keyAllowed } from '../access/roles'

/**
 * Answers sent through "Form" sections on website pages (join, contact, …). Written only by the server route
 * /api/forms (validated against the form's own field list); never creatable through the CMS or REST API.
 * Contains personal data → readable by registration managers and media, deletable by admins.
 */
export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  labels: { singular: 'Form submission', plural: 'Form submissions' },
  admin: {
    group: 'Website',
    useAsTitle: 'formName',
    defaultColumns: ['formName', 'summary', 'page', 'createdAt', 'handled'],
    listSearchableFields: ['formName', 'summary', 'page'],
    description: 'Messages and applications sent through website forms. Contains personal data: do not share.',
    hidden: hiddenUnlessAny(['formSubmissions.view']),
  },
  access: {
    read: keyAllowed('formSubmissions.view'),
    create: () => false, // only the /api/forms route (local API, overrideAccess)
    update: keyAllowed('formSubmissions.handle'), // to tick "handled"
    delete: ({ req: { user } }) => isAdmin(user),
  },
  fields: [
    { name: 'formName', type: 'text', required: true, admin: { readOnly: true } },
    { name: 'page', type: 'text', admin: { readOnly: true } },
    { name: 'summary', type: 'text', admin: { readOnly: true, description: 'First answers, for the list view' } },
    {
      name: 'answers',
      type: 'array',
      admin: { readOnly: true },
      fields: [
        { name: 'label', type: 'text' },
        { name: 'value', type: 'textarea' },
      ],
    },
    { name: 'handled', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'notes', type: 'textarea', admin: { position: 'sidebar', description: 'Internal notes' } },
  ],
}
