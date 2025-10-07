import type { CollectionConfig, PayloadRequest } from 'payload'

const ownsNote = (req: PayloadRequest) =>
  req.user
    ? {
        user: {
          equals: req.user.id,
        },
      }
    : false

const Notes: CollectionConfig = {
  slug: 'notes',
  access: {
    read: ({ req }) => ownsNote(req),
    create: ({ req }) => !!req.user,
    update: ({ req }) => ownsNote(req),
    delete: ({ req }) => ownsNote(req),
  },
  fields: [
    {
      name: 'content',
      type: 'text',
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      defaultValue: ({ user }: { user: PayloadRequest['user'] }) => user?.id,
      access: {
        update: ({ req }: { req: PayloadRequest }) => req.user?.role === 'admin',
      },
      admin: {
        readOnly: true,
      },
    },
  ],
  hooks: {
    beforeValidate: [({ data, req, operation }) => {
      if (!req.user) {
        return data
      }

      if (operation === 'create') {
        return {
          ...data,
          user: req.user.id,
        }
      }

      if (operation === 'update' && req.user.role !== 'admin') {
        return {
          ...data,
          user: req.user.id,
        }
      }

      return data
    }],
  },
  timestamps: true,
}

export default Notes
