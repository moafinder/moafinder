import type { CollectionConfig, PayloadRequest } from 'payload'

const Notes: CollectionConfig = {
  slug: 'notes',
  access: {
    read: ({ req }: { req: PayloadRequest }) => {
      if (!req.user) return false
      return { user: { equals: req.user.id } } as any
    },
    create: ({ req }: { req: PayloadRequest }) => !!req.user,
    update: ({ req }: { req: PayloadRequest }) => {
      if (!req.user) return false
      return { user: { equals: req.user.id } } as any
    },
    delete: ({ req }: { req: PayloadRequest }) => {
      if (!req.user) return false
      return { user: { equals: req.user.id } } as any
    },
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
  timestamps: true,
}

export default Notes
