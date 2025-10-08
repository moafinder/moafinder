import type { CollectionConfig } from 'payload'

export const ENFORCED_DEFAULT_ROLE = 'organizer'
const isProduction = process.env.NODE_ENV === 'production'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    create: () => true,
    update: ({ req }) => req.user?.role === 'admin',
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    cookies: {
      sameSite: isProduction ? 'None' : 'Lax',
      secure: isProduction,
    },
  },
  hooks: {
    beforeChange: [({ data, req, operation }) => {
      if (!data) return data

      if (operation === 'create') {
        // Only admins may choose a custom role; everyone else is forced to organizer.
        if (req.user?.role === 'admin') {
          if (!data.role) {
            data.role = ENFORCED_DEFAULT_ROLE
          }
        } else {
          data.role = ENFORCED_DEFAULT_ROLE
        }
      } else if (operation === 'update' && req.user?.role !== 'admin') {
        delete data.role
      }

      return data
    }],
  },
  fields: [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: false,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: ENFORCED_DEFAULT_ROLE,
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Editor',
          value: 'editor',
        },
        {
          label: 'Organizer',
          value: ENFORCED_DEFAULT_ROLE,
        },
      ],
      access: {
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
  ],
}
