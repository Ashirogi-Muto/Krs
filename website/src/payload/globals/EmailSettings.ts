import type { GlobalConfig } from 'payload'
import { adminsOnly } from '../access/roles'

/**
 * Email switches (owner, 20 Oct 2026: "turn off registration confirmation emails for now"). Admins only. While
 * registration confirmations are off, new ones still go into the Email queue as Pending and the worker skips them:
 * they go out when the switch is turned back on, or can be deleted in the Email queue. Account emails (confirm your
 * address, password reset) are not affected. The daily limit itself is MAIL_DAILY_LIMIT on the server.
 */
export const EmailSettings: GlobalConfig = {
  slug: 'email-settings',
  label: 'Email settings',
  admin: {
    group: 'Website',
    description: 'Turn kinds of email on or off. Account emails (confirm your address, password reset) always go out.',
    hidden: ({ user }) => !adminsOnly({ req: { user } } as any),
  },
  access: { read: adminsOnly, update: adminsOnly },
  fields: [
    {
      name: 'registrationConfirmations',
      label: 'Send registration confirmation emails',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Untick to stop them (e.g. to save the daily email limit). While off, new ones wait in AURIX → Email queue as Pending and go out when you tick this again; delete them there if they should never be sent.',
      },
    },
  ],
}
