import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    create: () => true,
    update: ({ req }) => req.user?.role === 'admin',
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'organizer',
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
          value: 'organizer',
        },
      ],
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
  ],
}
